"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Command } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
// TODO: Supabase 인증 연동 시 실제 로그인 로직 구현 필요
// import { login } from "@/app/auth/actions";

const loginSchema = z.object({
    email: z.string().email("유효한 이메일 주소를 입력해주세요."),
    password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * 로그인 페이지 컴포넌트입니다.
 * 이메일/비밀번호 로그인을 제공하며 회원가입 페이지로의 링크를 포함합니다.
 */
function LoginContent() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const signupSuccess = searchParams.get('signup') === 'success';

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values: LoginFormValues) => {
        setIsLoading(true);
        setErrorDetails(null);

        const supabase = createClient();

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            });

            if (error) {
                console.error("Login Supabase error:", error.message);
                throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
            }

            // 성공 시 대시보드로 이동
            router.push("/");
            router.refresh(); // 세션 상태 반영을 위해 새로고침
        } catch (error: any) {
            console.error("Login failed:", error);
            setErrorDetails(error.message || "로그인 중 문제가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
            <div className="w-full max-w-md space-y-8">
                {/* 서비스 로고 및 소개 */}
                <div className="flex flex-col items-center text-center space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-full mb-2">
                        <Command className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Task Master AI
                    </h1>
                    <p className="text-muted-foreground text-sm max-w-xs">
                        AI가 도와주는 스마트한 할 일 관리
                    </p>
                </div>

                {/* 로그인 카드 */}
                <Card className="border-border/40 shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-xl">로그인</CardTitle>
                        <CardDescription>
                            이메일과 비밀번호를 입력하여 계정에 접속하세요.
                        </CardDescription>
                        {signupSuccess && (
                            <div className="p-3 bg-green-500/10 text-green-600 text-sm rounded-md font-medium mt-2">
                                회원가입이 완료되었습니다. 로그인해주세요.
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>이메일</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="name@example.com"
                                                    type="email"
                                                    autoComplete="email"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>비밀번호</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="비밀번호 입력"
                                                    type="password"
                                                    autoComplete="current-password"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {errorDetails && (
                                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md font-medium">
                                        {errorDetails}
                                    </div>
                                )}

                                <Button className="w-full" type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            로그인 중...
                                        </>
                                    ) : (
                                        "로그인"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 text-center text-sm text-muted-foreground">
                        <div className="text-center w-full">
                            계정이 없으신가요?{" "}
                            <Link
                                href="/signup"
                                className="text-primary hover:underline font-medium underline-offset-4"
                            >
                                회원가입
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
