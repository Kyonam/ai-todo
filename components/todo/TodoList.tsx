"use client";

import { Todo } from "@/types/todo";
import TodoCard from "./TodoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList } from "lucide-react";

interface TodoListProps {
    todos: Todo[];
    isLoading?: boolean;
    onToggle: (id: string, checked: boolean) => void;
    onDelete: (id: string) => void;
    onEdit: (todo: Todo) => void;
}

/**
 * 할 일 목록을 그리드로 보여주는 컴포넌트입니다.
 * 로딩 상태와 빈 상태에 대한 UI를 포함합니다.
 */
const TodoList = ({ todos, isLoading = false, onToggle, onDelete, onEdit }: TodoListProps) => {
    // 로딩 상태 UI
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, index) => (
                    <div key={index} className="space-y-3">
                        <Skeleton className="h-[125px] w-full rounded-xl" />
                    </div>
                ))}
            </div>
        );
    }

    // 빈 상태 UI
    if (todos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg border-muted-foreground/25 bg-muted/50">
                <div className="bg-background p-3 rounded-full mb-4">
                    <ClipboardList className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">할 일이 없습니다.</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    새로운 할 일을 추가하여 하루를 계획해보세요.
                    AI를 활용하면 더 쉽게 관리할 수 있습니다.
                </p>
            </div>
        );
    }

    // 목록 렌더링
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todos.map((todo) => (
                <TodoCard
                    key={todo.id}
                    todo={todo}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onEdit={onEdit}
                />
            ))}
        </div>
    );
};

export default TodoList;
