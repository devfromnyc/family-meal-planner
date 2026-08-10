import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/passwordReset";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "");
    await requestPasswordReset(email);
    return NextResponse.json({
      ok: true,
      message:
        "If an account exists for that email, a reset link has been sent.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
