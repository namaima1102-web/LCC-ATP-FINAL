import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/supabase/auth";

export async function GET() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Chưa đăng nhập hoặc không có quyền Admin." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    admin: {
      userId: admin.userId,
      email: admin.email,
      displayName: admin.displayName,
    },
  });
}
