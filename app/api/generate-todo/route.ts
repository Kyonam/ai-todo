import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        let { prompt } = body;

        // 1. 입력 검증 (Input Validation)
        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json(
                { error: '잘못된 입력입니다. 내용을 텍스트로 입력해주세요.' },
                { status: 400 }
            );
        }

        // 2. 전처리 (Preprocessing)
        // 앞뒤 공백 제거 및 연속된 공백을 하나로 통합
        prompt = prompt.trim().replace(/\s+/g, ' ');

        // 길이 제한 체크
        if (prompt.length < 2) {
            return NextResponse.json(
                { error: '할 일 내용은 최소 2자 이상 구체적으로 입력해주세요.' },
                { status: 400 }
            );
        }
        if (prompt.length > 500) {
            return NextResponse.json(
                { error: '할 일 내용은 최대 500자까지 입력 가능합니다.' },
                { status: 400 }
            );
        }

        // 현재 날짜 컨텍스트 제공
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", // 사용자가 요청했던 모델 유지, 실패시 fallback 모델 고려 가능
        });

        const generationConfig = {
            temperature: 0.9,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
        };

        const systemInstruction = {
            role: "system",
            parts: [
                {
                    text: `You are an AI assistant that extracts structured todo data from natural language input.
                    Current Date: ${currentDate}
                    Current Time: ${currentTime}
                    
                    Follow these strict rules for extraction:

                    1. Date Processing Rules:
                    - "오늘" (Today) -> Current Date
                    - "내일" (Tomorrow) -> Current Date + 1 day
                    - "모레" (Day after tomorrow) -> Current Date + 2 days
                    - "이번 주 [요일]" (This [Day]) -> The nearest upcoming [Day]
                    - "다음 주 [요일]" (Next [Day]) -> The [Day] of the next week

                    2. Time Processing Rules:
                    - "아침" (Morning) -> 09:00
                    - "점심" (Lunch) -> 12:00
                    - "오후" (Afternoon) -> 14:00
                    - "저녁" (Evening) -> 18:00
                    - "밤" (Night) -> 21:00
                    - specific time -> HH:MM (24-hour format)
                    - Default -> "09:00" (if date exists but no time specified)

                    3. Priority Keywords:
                    - High: '급하게', '중요한', '빨리', '꼭', '반드시' (urgent, important, fast, must)
                    - Low: '여유롭게', '천천히', '언젠가' (leisurely, slowly, someday)
                    - Medium: '보통', '적당히' or No specific keyword

                    4. Category Classification Keywords:
                    - "업무" (Work): '회의', '보고서', '프로젝트', '업무'
                    - "개인" (Personal): '쇼핑', '친구', '가족', '개인'
                    - "건강" (Health): '운동', '병원', '건강', '요가'
                    - "학습" (Study): '공부', '책', '강의', '학습'
                    - Use these categories if keywords match, otherwise infer context.

                    5. Output Format:
                    - Return ONLY raw JSON. Do not use Markdown code blocks.
                    
                    Expected JSON Structure:
                    {
                        "title": "String",
                        "description": "String (optional)",
                        "priority": "high" | "medium" | "low",
                        "category": ["String"],
                        "due_date": "YYYY-MM-DD",
                        "due_time": "HH:MM"
                    }`
                }
            ]
        };

        const chatSession = model.startChat({
            generationConfig,
            systemInstruction,
        });

        const result = await chatSession.sendMessage(prompt);
        const responseText = result.response.text();

        // JSON 파싱
        let todo;
        try {
            todo = JSON.parse(responseText);
        } catch (e) {
            // 마크다운 코드 블록 제거 후 재시도
            const cleanJson = responseText.replace(/```json\n|\n```/g, "").trim();
            todo = JSON.parse(cleanJson);
        }

        // 3. 후처리 (Post-processing)

        // 제목 길이 조정: 제목이 없으면 프롬프트 일부 사용, 너무 길면 축약
        if (!todo.title) {
            todo.title = prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt;
        } else if (todo.title.length > 50) {
            // 제목이 너무 길면 설명에 전체 내용 추가 후 제목 축약
            if (!todo.description) {
                todo.description = todo.title;
            }
            todo.title = todo.title.substring(0, 47) + "...";
        }

        // 필수 필드 기본값 설정
        if (!todo.priority) todo.priority = "medium";

        // 날짜 과거 여부 확인 (AI가 과거 날짜를 반환한 경우 오늘 날짜로 보정)
        // 단, 명시적으로 과거 날짜를 적은 경우는 제외일 수 있으나, 할 일 생성 목적상 현재 시점 기준으로 보정
        if (todo.due_date) {
            const dueDate = new Date(todo.due_date);
            const today = new Date(currentDate); // 시간 제외한 오늘 날짜
            if (dueDate < today) {
                todo.due_date = currentDate;
            }
        }

        return NextResponse.json({ todo });

    } catch (error: any) {
        console.error('AI Processing Error:', error);

        let status = 500;
        let message = 'AI 요청 처리에 실패했습니다. 잠시 후 다시 시도해주세요.';
        // 에러 상세 내용을 포함할지 여부
        let details = error.message || String(error);

        // 4. 오류 응답 (Error Response)
        if (status === 500 && error.message?.includes('429')) {
            status = 429;
            message = '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.status === 400 || error.message?.includes('400')) {
            status = 400;
            message = '잘못된 요청입니다. 입력을 확인해주세요.';
        }

        return NextResponse.json(
            { error: message, details },
            { status }
        );
    }
}
