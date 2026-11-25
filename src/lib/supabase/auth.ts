import { createClient } from "./server";

export interface AdminUser {
  userId: string;
  email: string | null;
  displayName: string | null;
}

/**
 * Kiểm tra người dùng hiện tại đã đăng nhập và có trong bảng `admins` hay chưa.
 * Trả về `null` nếu chưa đăng nhập hoặc không có quyền Admin.
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: adminRow, error: adminError } = await supabase
    .from("admins")
    .select("user_id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !adminRow) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    displayName: adminRow.display_name ?? null,
  };
}
