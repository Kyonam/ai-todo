import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { todos, timeframe } = body;

        if (!todos || !Array.isArray(todos)) {
            return NextResponse.json(
                { error: '할 일 목록 데이터가 올바르지 않습니다.' },
                { status: 400 }
            );
        }

        // 할 일이 없으면 바로 빈 결과 반환
        if (todos.length === 0) {
            return NextResponse.json({
                summary: '분석할 할 일이 아직 없습니다. 새로운 할 일을 추가해보세요!',
                urgentTasks: [],
                insights: ['할 일을 추가하면 AI가 분석해드립니다.'],
                recommendations: ['먼저 오늘 해야 할 일을 기록하는 것부터 시작해보세요.']
            });
        }

        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", // 사용자 요청 모델
        });

        const generationConfig = {
            temperature: 0.7, // 분석은 조금 더 정제된 결과가 필요하므로 온도를 낮춤
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
        };

        const timeframeText = timeframe === 'today' ? '오늘 하루' : '이번 주';

        const systemInstruction = {
            role: "system",
            parts: [
                {
                    text: `You are a sophisticated AI productivity coach acting as a comprehensive analyzer for a Todo App.
                    Current Date: ${currentDate}
                    Current Time: ${currentTime}
                    Target Timeframe: ${timeframeText}

                    Your goal is to provide a deep, encouraging, and actionable analysis of the user's todo list.
                    The tone MUST be natural, friendly, and motivating in Korean (한국어).

                    **Core Analysis Requirements:**

                    1. **Completion Rate & Patterns:**
                       - Calculate daily/weekly completion rates.
                       - Analyze how well high-priority tasks are being handled compared to low-priority ones.
                       - Compare current progress against typical patterns if inferable.

                    2. **Time Management:**
                       - Evaluate deadline compliance (overdue tasks vs. on-time).
                       - Analyze the distribution of tasks across different times of the day (morning, afternoon, evening).
                       - Identify distinct clusters of workload.

                    3. **Productivity Insights:**
                       - Identify the most productive days or times based on completed tasks.
                       - Spot types of tasks that are frequently postponed or left incomplete.
                       - Find common characteristics of tasks that get done quickly.

                    4. **Positive Feedback (Crucial):**
                       - Always start with what the user is doing well.
                       - Use positive reinforcement to encourage improvement.

                    **Timeframe Specific Instructions:**
                    - **today:** Focus on remaining focus for the day, immediate priorities, and daily rhythm. Suggest a strong finish.
                    - **week:** Focus on weekly patterns, overall accomplishment, and strategic preparation for the next week.

                    **Output Requirements (JSON format ONLY):**
                    {
                        "summary": "String. A comprehensive summary sentence including completion percentage and a positive opening remark. (e.g., '오늘 80%의 할 일을 완료하셨네요! 정말 생산적인 하루입니다.')",
                        "urgentTasks": ["String", "String"]. List of up to 3 most critical pending tasks (High priority + imminent due date).",
                        "insights": ["String", "String"]. 3-4 specific observations about productivity patterns, time usage, or workload. (e.g., '주로 오후 2시경에 업무 집중도가 높습니다.', '오전에는 가벼운 개인 업무를 처리하는 경향이 있네요.').",
                        "recommendations": ["String", "String"]. 3-4 actionable, specific advice items. Include tips for time blocking, prioritizing, or rest. (e.g., '남은 긴급 업무는 내일 오전으로 일정을 조정해보세요.', '지금은 잠시 휴식을 취하고 저녁에 보고서를 마무리하는 것이 좋겠습니다.')."
                    }
                    `
                }
            ]
        };

        const chatSession = model.startChat({
            generationConfig,
            systemInstruction,
        });

        // 할 일 목록을 텍스트로 변환하여 프롬프트로 전달
        const todosText = JSON.stringify(todos.map(t => ({
            title: t.title,
            priority: t.priority,
            due_date: t.due_date,
            due_time: t.due_time,
            completed: t.completed,
            category: t.category,
            created_at: t.created_at // 생성일 정보 추가
        })));

        const prompt = `Here is my todo list for ${timeframeText}: ${todosText}. Please analyze it.`;

        const result = await chatSession.sendMessage(prompt);
        const responseText = result.response.text();

        let analysisH;
        try {
            analysisH = JSON.parse(responseText);
        } catch (e) {
            const cleanJson = responseText.replace(/```json\n|\n```/g, "").trim();
            analysisH = JSON.parse(cleanJson);
        }

        return NextResponse.json(analysisH);

    } catch (error: any) {
        console.error('AI Analysis Error:', error);
        return NextResponse.json(
            { error: 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', details: error.message },
            { status: 500 }
        );
    }
}
