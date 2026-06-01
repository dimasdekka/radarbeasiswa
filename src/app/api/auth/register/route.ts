import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { email, password, name } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Create a pre-confirmed user (no email confirmation step needed for the demo).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createErr) {
    const msg = /already (been )?registered|exists/i.test(createErr.message)
      ? "Email sudah terdaftar. Silakan masuk."
      : createErr.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Mirror into our app DB (Profile is created later in onboarding).
  if (created.user) {
    await prisma.user.upsert({
      where: { id: created.user.id },
      update: { email, name },
      create: { id: created.user.id, email, name },
    });
  }

  // Establish a session immediately so the user is logged in after registering.
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInErr) {
    // Account was created; just couldn't auto-login. Let them log in manually.
    return NextResponse.json({ user: created.user, autoLogin: false });
  }

  return NextResponse.json({ user: signInData.user, autoLogin: true });
}
