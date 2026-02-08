"use client";

import { useState, useMemo } from "react";
import { Todo } from "@/types/todo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Sparkles, Loader2, BarChart2, CheckCircle2, AlertCircle,
    Clock, Lightbulb, Calendar, ArrowRight, Target, TrendingUp
} from "lucide-react";
import { format, isToday, isThisWeek, parseISO, getDay, startOfWeek, addDays, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AnalysisResult {
    summary: string;
    urgentTasks: string[];
    insights: string[];
    recommendations: string[];
}

interface TodoAnalysisProps {
    todos: Todo[];
}

export default function TodoAnalysis({ todos }: TodoAnalysisProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [activeTab, setActiveTab] = useState("today");

    // 1. 데이터 필터링 및 통계 계산
    const stats = useMemo(() => {
        if (!todos) return { total: 0, completed: 0, rate: 0, pending: [], targetTodos: [], weeklyData: [] };

        const targetTodos = todos.filter(todo => {
            if (!todo.due_date) return false;
            const date = typeof todo.due_date === 'string' ? parseISO(todo.due_date) : new Date(todo.due_date);

            if (activeTab === "today") {
                return isToday(date);
            } else {
                return isThisWeek(date, { weekStartsOn: 1 });
            }
        });

        const total = targetTodos.length;
        const completed = targetTodos.filter(t => t.completed).length;
        const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
        const pending = targetTodos.filter(t => !t.completed); // 남은 할 일

        // 주간 차트 데이터 (이번 주 월~일)
        const weeklyData = Array.from({ length: 7 }).map((_, i) => {
            const dayStart = startOfWeek(new Date(), { weekStartsOn: 1 });
            const currentDay = addDays(dayStart, i);
            const dayTodos = todos.filter(t => {
                if (!t.due_date) return false;
                const d = typeof t.due_date === 'string' ? parseISO(t.due_date) : new Date(t.due_date);
                return isSameDay(d, currentDay);
            });
            return {
                day: format(currentDay, "EE", { locale: ko }),
                count: dayTodos.filter(t => t.completed).length,
                total: dayTodos.length
            };
        });

        return { total, completed, rate, pending, targetTodos, weeklyData };
    }, [todos, activeTab]);

    const handleAnalyze = async () => {
        setIsLoading(true);
        // setResult(null); // 기존 결과를 유지하면서 로딩 표시 (깜빡임 방지)

        if (stats.targetTodos.length === 0) {
            setResult({
                summary: activeTab === 'today' ? "오늘 예정된 할 일이 없습니다." : "이번 주 예정된 할 일이 없습니다.",
                urgentTasks: [],
                insights: ["할 일을 추가하고 다시 분석해주세요."],
                recommendations: ["새로운 목표를 세워보는 건 어떨까요?"]
            });
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/analyze-todos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    todos: stats.targetTodos,
                    timeframe: activeTab
                }),
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            setResult(data as AnalysisResult);
        } catch (error) {
            console.error("Analysis Failed:", error);
            // 에러 시 기존 결과 유지 혹은 에러 메시지 표시
        } finally {
            setIsLoading(false);
        }
    };

    // 오늘 탭 렌더링
    const renderTodayContent = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* 상단: 완료율 및 진행상황 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900 shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">오늘의 달성률</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{stats.rate}%</span>
                            <span className="text-sm text-muted-foreground">
                                ({stats.completed}/{stats.total} 완료)
                            </span>
                        </div>
                    </div>
                    {stats.rate === 100 && (
                        <Badge className="bg-green-500 hover:bg-green-600 animate-pulse">
                            🎉 완벽해요!
                        </Badge>
                    )}
                </div>
                {/* Custom Progress Bar */}
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                        style={{ width: `${stats.rate}%` }}
                    />
                </div>
            </div>

            {result && (
                <>
                    {/* AI 요약 */}
                    <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                        <h4 className="flex items-center gap-2 font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
                            <Sparkles className="h-4 w-4 text-indigo-500" />
                            AI 요약
                        </h4>
                        <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed">
                            {result.summary}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 긴급 업무 (High Priority) */}
                        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50">
                            <h4 className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-400 mb-3">
                                <AlertCircle className="h-4 w-4" />
                                지금 집중하세요
                            </h4>
                            {result.urgentTasks?.length > 0 ? (
                                <ul className="space-y-2">
                                    {result.urgentTasks.map((task, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-300">
                                            <Target className="h-4 w-4 mt-0.5 shrink-0" />
                                            <span>{task}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">긴급한 업무가 없습니다. 여유를 즐기세요!</p>
                            )}
                        </div>

                        {/* 추천 사항 */}
                        <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50">
                            <h4 className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400 mb-3">
                                <Lightbulb className="h-4 w-4" />
                                AI의 제안
                            </h4>
                            <ul className="space-y-2">
                                {result.recommendations?.map((rec, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-300">
                                        <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 opacity-50" />
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    // 이번 주 탭 렌더링
    const renderWeekContent = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* 주간 생산성 차트 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h4 className="font-semibold text-lg">주간 활동 그래프</h4>
                        <p className="text-xs text-muted-foreground">이번 주 요일별 완료 현황</p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.completed}</span>
                        <span className="text-sm text-muted-foreground"> tasks done</span>
                    </div>
                </div>

                {/* Bar Chart Visualization */}
                <div className="flex items-end justify-between h-32 gap-2">
                    {stats.weeklyData.map((data, idx) => {
                        // 최대 높이 계산을 위한 상대적 비율 (최소 10% 높이 유지)
                        const maxVal = Math.max(...stats.weeklyData.map(d => d.total), 5);
                        const barHeight = data.count > 0 ? (data.count / maxVal) * 100 : 5;

                        return (
                            <div key={idx} className="flex flex-col items-center gap-2 w-full group">
                                <div className="relative w-full h-full flex items-end justify-center rounded-t-sm bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition-colors">
                                    <div
                                        className={cn(
                                            "w-2/3 rounded-t-md transition-all duration-700 ease-out group-hover:opacity-90",
                                            data.count > 0 ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
                                        )}
                                        style={{ height: `${data.count > 0 ? barHeight : 5}%` }}
                                    />
                                    {/* Tooltip-like number */}
                                    {data.count > 0 && (
                                        <span className="absolute -top-6 text-xs font-bold text-indigo-600">{data.count}</span>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-xs font-medium",
                                    isToday(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), idx))
                                        ? "text-indigo-600 font-bold"
                                        : "text-muted-foreground"
                                )}>
                                    {data.day}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 인사이트 */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
                        <h4 className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-400 mb-3">
                            <TrendingUp className="h-4 w-4" />
                            생산성 패턴
                        </h4>
                        <ul className="space-y-3">
                            {result.insights?.map((insight, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-300">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 opacity-70" />
                                    <span>{insight}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 다음 주 제안 (Recommendations 활용) */}
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                        <h4 className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400 mb-3">
                            <Calendar className="h-4 w-4" />
                            다음 주 계획 & 제안
                        </h4>
                        <ul className="space-y-3">
                            {result.recommendations?.map((rec, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-emerald-600 dark:text-emerald-300">
                                    <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 opacity-50" />
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <Card className="w-full bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 border-none shadow-md overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="bg-white/50 dark:bg-slate-950/50 border-b pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">AI 생산성 코치</CardTitle>
                            <CardDescription className="text-xs">
                                Gemini가 분석한 {activeTab === "today" ? "오늘의" : "이번 주"} 업무 리포트
                            </CardDescription>
                        </div>
                    </div>
                    {/* 분석 버튼 (결과가 없을 때) */}
                    {!result && !isLoading && stats.total > 0 && (
                        <Button
                            size="sm"
                            onClick={handleAnalyze}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md transition-all"
                        >
                            <Sparkles className="mr-2 h-3.5 w-3.5" />
                            분석 시작
                        </Button>
                    )}
                    {/* 재분석 버튼 (결과가 있을 때) */}
                    {result && !isLoading && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAnalyze}
                            className="text-muted-foreground hover:text-indigo-600"
                        >
                            <Clock className="mr-2 h-3.5 w-3.5" />
                            업데이트
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={(val) => {
                    setActiveTab(val);
                    setResult(null); // 탭 변경 시 결과 초기화하여 새로운 분석 유도 (데이터가 바뀔 수 있으므로)
                }} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 dark:bg-slate-800">
                        <TabsTrigger value="today">오늘의 요약</TabsTrigger>
                        <TabsTrigger value="week">이번 주 요약</TabsTrigger>
                    </TabsList>

                    {/* Loading State */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in duration-300">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
                                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 relative z-10" />
                            </div>
                            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 animate-pulse">
                                당신의 업무 패턴을 분석하고 있습니다...
                            </p>
                        </div>
                    ) : (
                        <>
                            <TabsContent value="today" className="mt-0 focus-visible:ring-0">
                                {renderTodayContent()}
                            </TabsContent>
                            <TabsContent value="week" className="mt-0 focus-visible:ring-0">
                                {renderWeekContent()}
                            </TabsContent>
                        </>
                    )}
                </Tabs>
            </CardContent>
        </Card>
    );
}
