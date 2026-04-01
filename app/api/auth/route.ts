import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();
  
  // Senha simples — troque pelo que quiser
  const VALID_PASSWORD = process.env.APP_PASSWORD || "crm2025";
  
  if (password === VALID_PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("crm-auth", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/",
    });
    return response;
  }

  return NextResponse.json({ success: false, error: "Senha incorreta" }, { status: 401 });
}
