import { Resend } from "resend";

function getFromAddress() {
  return (
    process.env.EMAIL_FROM?.trim() ||
    "Family Meal Planner <onboarding@resend.dev>"
  );
}

export async function sendPasswordResetEmail(input: {
  to: string;
  name?: string | null;
  resetUrl: string;
}) {
  const key = process.env.RESEND_API_KEY?.trim();
  const greeting = input.name?.trim() ? `Hi ${input.name.trim()},` : "Hi,";
  const subject = "Reset your Family Meal Planner password";
  const text = `${greeting}

We received a request to reset your Family Meal Planner password.

Open this link to choose a new password (expires in 1 hour):
${input.resetUrl}

If you did not ask for this, you can ignore this email.

— Family Meal Planner`;

  const html = `
    <p>${greeting}</p>
    <p>We received a request to reset your <strong>Family Meal Planner</strong> password.</p>
    <p><a href="${input.resetUrl}">Choose a new password</a></p>
    <p style="color:#666;font-size:14px">This link expires in 1 hour. If you did not ask for this, you can ignore this email.</p>
  `;

  if (!key) {
    console.warn(
      "[password-reset] RESEND_API_KEY is not set. Reset link for",
      input.to,
      "→",
      input.resetUrl,
    );
    return { queued: false as const, logged: true as const };
  }

  const resend = new Resend(key);
  const result = await resend.emails.send({
    from: getFromAddress(),
    to: input.to,
    subject,
    text,
    html,
  });

  if (result.error) {
    throw new Error(result.error.message || "Failed to send reset email");
  }

  return { queued: true as const, id: result.data?.id };
}
