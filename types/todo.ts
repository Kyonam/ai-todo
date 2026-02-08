export type Priority = 'high' | 'medium' | 'low';

export interface Todo {
    id: string;
    user_id: string;
    title: string;
    description?: string | null;
    priority: Priority;
    category: string[];
    due_date?: string | Date | null;
    completed: boolean;
    created_at: string | Date;
}
