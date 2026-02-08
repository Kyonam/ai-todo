"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Priority, Todo } from "@/types/todo";

// 폼 스키마 정의
const todoFormSchema = z.object({
    title: z.string().min(1, "할 일을 입력해주세요."),
    description: z.string().optional(),
    priority: z.enum(["high", "medium", "low"] as [Priority, ...Priority[]]),
    category: z.string().optional(), // 콤마로 구분하여 입력받음
    due_date: z.date().optional(),
    due_time: z.string().optional(),
});

type TodoFormValues = z.infer<typeof todoFormSchema>;

interface TodoFormProps {
    initialData?: Todo;
    onSubmit: (values: TodoFormValues) => Promise<void>;
    isSubmitting?: boolean;
}

/**
 * 할 일 생성 및 수정을 위한 폼 컴포넌트입니다.
 * React Hook Form과 Zod를 사용하여 유효성 검사를 수행합니다.
 */
const TodoForm = ({ initialData, onSubmit, isSubmitting = false }: TodoFormProps) => {
    const form = useForm<TodoFormValues>({
        resolver: zodResolver(todoFormSchema),
        defaultValues: {
            title: initialData?.title || "",
            description: initialData?.description || "",
            priority: initialData?.priority || "medium",
            category: initialData?.category?.join(", ") || "",
            due_date: initialData?.due_date ? new Date(initialData.due_date) : undefined,
            due_time: initialData?.due_date ? format(new Date(initialData.due_date), "HH:mm") : undefined,
        },
    });

    const [aiPrompt, setAiPrompt] = useState("");
    const [isAiLoading, setIsAiLoading] = useState(false);

    // AI 할 일 생성 핸들러
    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;

        setIsAiLoading(true);
        try {
            const response = await fetch("/api/generate-todo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: aiPrompt }),
            });

            const data = await response.json();

            if (data.error) {
                console.error("AI Error:", data.error);
                alert("AI 요청 처리에 실패했습니다.");
                return;
            }

            const { todo } = data;

            // 폼 필드 업데이트
            form.setValue("title", todo.title);

            // 입력한 문장을 기본 설명으로 사용, AI가 생성한 설명이 있다면 뒤에 추가
            const descriptionValue = todo.description
                ? `${aiPrompt}\n\n(AI 요약: ${todo.description})`
                : aiPrompt;
            form.setValue("description", descriptionValue);

            // 우선순위 값 검증 및 설정 (소문자 변환)
            let priorityValue: Priority = "medium";
            if (todo.priority) {
                const lowerPriority = todo.priority.toLowerCase();
                if (['high', 'medium', 'low'].includes(lowerPriority)) {
                    priorityValue = lowerPriority as Priority;
                }
            }
            form.setValue("priority", priorityValue);

            if (todo.category && Array.isArray(todo.category)) {
                form.setValue("category", todo.category.join(", "));
            }

            if (todo.due_date) {
                const date = new Date(todo.due_date);
                if (!isNaN(date.getTime())) {
                    form.setValue("due_date", date);

                    if (todo.due_time) {
                        form.setValue("due_time", todo.due_time);
                    } else {
                        // 시간이 없으면 기본 09:00 설정 (요청사항 반영)
                        form.setValue("due_time", "09:00");
                    }
                }
            }

        } catch (error) {
            console.error("AI Request Failed:", error);
            alert("AI 요청 중 오류가 발생했습니다.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSubmit = async (values: TodoFormValues) => {
        // 날짜와 시간 병합 로직
        if (values.due_date) {
            const mergedDate = new Date(values.due_date);
            if (values.due_time) {
                const [hours, minutes] = values.due_time.split(':').map(Number);
                mergedDate.setHours(hours, minutes);
            } else {
                mergedDate.setHours(0, 0, 0, 0); // 시간 없으면 00:00
            }
            values.due_date = mergedDate;
        }

        await onSubmit(values);
        if (!initialData) {
            form.reset();
            setAiPrompt(""); // AI 프롬프트도 초기화
        }
    };

    return (
        <Form {...form}>
            {/* AI 입력 섹션 (신규 생성 시에만 표시) */}
            {!initialData && (
                <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2 mb-2 text-primary font-medium">
                        <Sparkles className="h-4 w-4" />
                        <span>AI로 똑똑하게 추가하기</span>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="예: 내일 오후 3시까지 중요한 팀 회의 준비하기"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAiGenerate();
                                }
                            }}
                            disabled={isAiLoading}
                            className="bg-background"
                        />
                        <Button
                            type="button"
                            onClick={handleAiGenerate}
                            disabled={!aiPrompt.trim() || isAiLoading}
                            variant="default"
                        >
                            {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "변환"}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 ml-1">
                        자연어로 입력하면 제목, 날짜, 우선순위를 자동으로 채워줍니다.
                    </p>
                </div>
            )}

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>할 일 제목</FormLabel>
                            <FormControl>
                                <Input placeholder="할 일을 입력하세요..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>우선순위</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="우선순위 선택" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="high">높음 (High)</SelectItem>
                                    <SelectItem value="medium">중간 (Medium)</SelectItem>
                                    <SelectItem value="low">낮음 (Low)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">

                    <FormField
                        control={form.control}
                        name="due_date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>마감 날짜</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP", { locale: ko })
                                                ) : (
                                                    <span>날짜 선택</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date < new Date(new Date().setHours(0, 0, 0, 0))
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="due_time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>마감 시간</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>카테고리</FormLabel>
                            <FormControl>
                                <Input placeholder="업무, 개인, 공부 (쉼표로 구분)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>상세 설명</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="상세 내용을 입력하세요"
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                처리 중...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                {initialData ? "할 일 수정" : "할 일 추가"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default TodoForm;
