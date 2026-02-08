"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Command,
  LogOut,
  Search,
  SortAsc,
  Filter,
  User,
  CheckCircle2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import TodoForm from "@/components/todo/TodoForm";
import TodoList from "@/components/todo/TodoList";
import TodoAnalysis from "@/components/todo/TodoAnalysis";
import { Todo, Priority } from "@/types/todo";
import { createClient } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

// Mock 데이터 생성
// MOCK 데이터 제거


export default function MainPage() {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("dueDate");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [editTodo, setEditTodo] = useState<Todo | undefined>(undefined);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  const supabase = createClient();

  // 할 일 목록 조회
  const fetchTodos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data as Todo[] || []);
    } catch (error) {
      console.error("Error fetching todos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 데이터 로딩 및 사용자 세션 확인
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchTodos();
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // 할 일 추가 핸들러
  const handleAddTodo = async (values: any) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('todos').insert({
        user_id: user.id,
        title: values.title,
        description: values.description,
        priority: values.priority,
        category: values.category ? values.category.split(",").map((c: string) => c.trim()) : [],
        due_date: values.due_date,
      });

      if (error) throw error;

      // 목록 갱신
      await fetchTodos();
    } catch (error) {
      console.error("Error adding todo:", error);
      alert("할 일을 추가하는 중 오류가 발생했습니다.");
    }
  };

  // 할 일 수정 핸들러
  const handleEditTodo = async (values: any) => {
    if (!editTodo || !user) return;

    try {
      const { error } = await supabase
        .from('todos')
        .update({
          title: values.title,
          description: values.description,
          priority: values.priority,
          category: typeof values.category === 'string'
            ? values.category.split(",").map((c: string) => c.trim())
            : values.category,
          due_date: values.due_date,
        })
        .eq('id', editTodo.id);

      if (error) throw error;

      await fetchTodos();
      setEditTodo(undefined); // 수정 모드 종료
    } catch (error) {
      console.error("Error updating todo:", error);
      alert("할 일을 수정하는 중 오류가 발생했습니다.");
    }
  };

  // 할 일 삭제 핸들러
  const handleDeleteTodo = async (id: string) => {
    if (!confirm("정말 이 할 일을 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (error) throw error;

      // 목록에서 즉시 제거 (Optimistic Update) 또는 재조회
      setTodos(todos.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Error deleting todo:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 할 일 완료 토글 핸들러
  const handleToggleTodo = async (id: string, checked: boolean) => {
    // Optimistic Update: UI 먼저 반영
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: checked } : t)));

    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: checked })
        .eq('id', id);

      if (error) {
        // 실패 시 롤백
        setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !checked } : t)));
        throw error;
      }
    } catch (error) {
      console.error("Error toggling todo:", error);
    }
  };

  // 수정 버튼 클릭 시 폼에 데이터 세팅
  const onEditRequest = (todo: Todo) => {
    setEditTodo(todo);
    // 화면 상단으로 스크롤 이동하여 폼을 보여줌 (모바일 고려)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 검색/필터/정렬 로직 적용
  const filteredTodos = todos
    .filter((todo) => {
      // 검색
      const matchesSearch =
        todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (todo.description && todo.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // 우선순위 필터
      const matchesPriority = filterPriority === "all" || todo.priority === filterPriority;

      return matchesSearch && matchesPriority;
    })
    .sort((a, b) => {
      // 정렬
      if (sortOrder === "dueDate") {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      } else if (sortOrder === "priority") {
        const priorityScore = { high: 3, medium: 2, low: 1 };
        return priorityScore[b.priority] - priorityScore[a.priority];
      } else if (sortOrder === "title") {
        return a.title.localeCompare(b.title);
      } else {
        // created (최신순)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* 1. 상단 헤더 */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <div className="flex items-center justify-center p-1.5 bg-primary rounded-lg text-primary-foreground">
                <Command className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg hidden md:inline-block">Task Master AI</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden md:inline-block text-sm font-medium text-muted-foreground mr-2">
                {user.email}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {user?.email?.[0].toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>프로필 설정</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>로그아웃</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 좌측: 할 일 입력 폼 (모바일에서는 상단) */}
          <aside className="lg:w-1/3 space-y-6">
            <div className="sticky top-24">
              <div className="mb-4">
                <p className="text-sm text-primary font-medium mb-2">
                  AI가 도와주는 스마트한 할 일 관리
                </p>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {editTodo ? "할 일 수정" : "새로운 할 일"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {editTodo
                    ? "선택된 할 일의 내용을 수정합니다."
                    : "오늘 해야 할 중요한 업무를 기록하고 관리하세요."}
                </p>
              </div>

              <div className="bg-card border rounded-xl shadow-sm p-6">
                <TodoForm
                  key={editTodo ? editTodo.id : "new"} // 키 변경으로 폼 리셋 유도
                  initialData={editTodo} // 수정 시 데이터 주입
                  onSubmit={editTodo ? handleEditTodo : handleAddTodo}
                />

                {editTodo && (
                  <Button
                    variant="ghost"
                    onClick={() => setEditTodo(undefined)}
                    className="w-full mt-2"
                  >
                    취소하고 새 할 일 추가하기
                  </Button>
                )}
              </div>
            </div>
          </aside>

          {/* 우측: 할 일 목록 및 툴바 */}
          <section className="lg:w-2/3 space-y-6">
            {/* 0. AI 분석 섹션 */}
            <TodoAnalysis todos={todos} />

            {/* 2. 툴바 영역 */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="할 일 검색..."
                  className="pl-9 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-1 flex-1 sm:flex-none">
                      <Filter className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">필터</span>
                      <span className="sm:hidden">필터</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>우선순위</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={filterPriority} onValueChange={setFilterPriority}>
                      <DropdownMenuRadioItem value="all">전체 보기</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="high">높음 (High)</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="medium">중간 (Medium)</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="low">낮음 (Low)</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-1 flex-1 sm:flex-none">
                      <SortAsc className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">정렬</span>
                      <span className="sm:hidden">정렬</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>정렬 기준</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={sortOrder} onValueChange={setSortOrder}>
                      <DropdownMenuRadioItem value="priority">중요도순</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="dueDate">마감일순</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="created">최신순</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="title">제목순</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* 3. 본문: Todo List */}
            <div className="min-h-[400px]">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="font-semibold text-lg">
                  내 할 일 목록
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({filteredTodos.length}개)
                  </span>
                </h3>
              </div>

              <TodoList
                todos={filteredTodos}
                isLoading={isLoading} // 로딩 상태 전달
                onToggle={handleToggleTodo}
                onDelete={handleDeleteTodo}
                onEdit={onEditRequest}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
