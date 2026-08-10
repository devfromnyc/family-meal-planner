import { NextResponse } from "next/server";
import { validatePassword } from "@/lib/password";
import { resetPasswordWithToken } from "@/lib/passwordReset";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body.token ?? "");
    const password = String(body.password ?? "");
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }
    await resetPasswordWithToken(token, password);
    return NextResponse.json({
      ok: true,
      message: "Password updated. You can log in now.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Reset failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
