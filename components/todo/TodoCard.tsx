"use client";

import { Todo } from "@/types/todo";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon, Clock, Trash2, Edit2, Tag } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TodoCardProps {
    todo: Todo;
    onToggle: (id: string, checked: boolean) => void;
    onDelete: (id: string) => void;
    onEdit: (todo: Todo) => void;
}

/**
 * 개별 할 일 항목을 표시하는 카드 컴포넌트입니다.
 * 우선순위에 따른 배지 색상과 마감 기한 표시 기능을 제공합니다.
 */
const TodoCard = ({ todo, onToggle, onDelete, onEdit }: TodoCardProps) => {
    const priorityColors = {
        high: "bg-red-500 hover:bg-red-600",
        medium: "bg-yellow-500 hover:bg-yellow-600",
        low: "bg-slate-500 hover:bg-slate-600",
    };

    const priorityLabels = {
        high: "높음",
        medium: "중간",
        low: "낮음",
    };

    return (
        <Card className={cn(
            "w-full transition-all duration-200 hover:shadow-md",
            todo.completed && "opacity-60 bg-muted"
        )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                    <Checkbox
                        checked={todo.completed}
                        onCheckedChange={(checked) => onToggle(todo.id, checked as boolean)}
                        className="h-5 w-5"
                    />
                    <Badge className={cn("text-white", priorityColors[todo.priority])}>
                        {priorityLabels[todo.priority]}
                    </Badge>
                    {todo.category && todo.category.map((cat) => (
                        <Badge key={cat} variant="outline" className="text-secondary-foreground items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {cat}
                        </Badge>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="py-3">
                <CardTitle className={cn(
                    "text-lg font-semibold leading-none tracking-tight mb-2",
                    todo.completed && "line-through text-muted-foreground"
                )}>
                    {todo.title}
                </CardTitle>
                {todo.description && (
                    <p className={cn(
                        "text-sm text-muted-foreground line-clamp-2",
                        todo.completed && "line-through"
                    )}>
                        {todo.description}
                    </p>
                )}
            </CardContent>

            <CardFooter className="flex justify-between items-center py-3 bg-muted/20 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                    {todo.due_date && (
                        <div className="flex items-center gap-1 text-red-500">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{format(new Date(todo.due_date), "yyyy. MM. dd a h:mm", { locale: ko })}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span>{format(new Date(todo.created_at), "yy-MM-dd", { locale: ko })}</span>
                    </div>
                </div>

                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(todo)}>
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">수정</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(todo.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">삭제</span>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

export default TodoCard;
