import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        // 사용자가 설정한 환경변수 키 이름 사용 (PUBLISHABLE_KEY)
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )
}
