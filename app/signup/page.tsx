"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

// 회원가입 폼 유효성 검사 스키마
const signupSchema = z.object({
    email: z.string().email("유효한 이메일 주소를 입력해주세요."),
    password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
    confirmPassword: z.string().min(6, "비밀번호 확인을 입력해주세요."),
}).refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

/**
 * 회원가입 페이지 컴포넌트입니다.
 * 이메일/비밀번호 입력을 통한 회원가입 기능을 제공합니다.
 */
export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);

    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values: SignupFormValues) => {
        setIsLoading(true);
        setErrorDetails(null);

        const supabase = createClient();

        try {
            const { error } = await supabase.auth.signUp({
                email: values.email,
                password: values.password,
            });

            if (error) {
                // Supabase 에러 메시지를 사용자 친화적으로 변환
                if (error.message.includes("already registered")) {
                    throw new Error("이미 가입된 이메일 주소입니다.");
                } else if (error.message.includes("weak")) {
                    throw new Error("비밀번호가 너무 취약합니다.");
                }
                throw error;
            }

            // 가입 성공 시 로그인 페이지로 이동하며 성공 메시지 파라미터 전달
            // 이메일 확인이 필요한 경우, 별도의 안내 페이지로 이동하거나 메시지를 띄울 수 있음
            router.push("/login?signup=success");
        } catch (error: any) {
            console.error("Signup failed:", error);
            setErrorDetails(error.message || "회원가입 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
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
                        지금 가입하고 AI와 함께 스마트한<br />할 일 관리를 시작해보세요.
                    </p>
                </div>

                {/* 회원가입 카드 */}
                <Card className="border-border/40 shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-xl">회원가입</CardTitle>
                        <CardDescription>
                            새로운 계정을 생성하기 위해 정보를 입력해주세요.
                        </CardDescription>
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

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>비밀번호</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="6자 이상 입력"
                                                        type="password"
                                                        autoComplete="new-password"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>비밀번호 확인</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="비밀번호 재입력"
                                                        type="password"
                                                        autoComplete="new-password"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {errorDetails && (
                                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md font-medium">
                                        {errorDetails}
                                    </div>
                                )}

                                <Button className="w-full" type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            가입 처리 중...
                                        </>
                                    ) : (
                                        "계정 생성하기"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 text-center text-sm text-muted-foreground">
                        <div className="text-center w-full">
                            이미 계정이 있으신가요?{" "}
                            <Link
                                href="/login"
                                className="text-primary hover:underline font-medium underline-offset-4"
                            >
                                로그인
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
