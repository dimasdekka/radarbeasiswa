import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin: rawOrigin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  // request.url resolves to the server's internal bind address (0.0.0.0:3000 /
  // the Cloud Run container host). Rebuild the real public origin from the
  // proxy/forwarded headers so redirects land on the URL the browser used.
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || new URL(rawOrigin).protocol.replace(":", "");
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : rawOrigin;

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=oauth", origin));
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/auth/login?error=oauth", origin));
  }

  const { data: { user } } = await supabase.auth.getUser();

  let destination = "/dashboard";

  if (user) {
    // Mirror the OAuth user into our app DB (first Google login = sign up).
    const name =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split("@")[0] ||
      "User";

    await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email ?? "", name },
      create: { id: user.id, email: user.email ?? "", name },
    });

    // New users (no profile yet) go to onboarding; returning users to dashboard.
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    destination = profile ? "/dashboard" : "/onboarding";
  }

  return NextResponse.redirect(new URL(next || destination, origin));
}
