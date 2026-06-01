import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Lookup role for client-side redirect decision
  let role = "USER";
  if (data.user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: { role: true },
    });
    if (dbUser) role = dbUser.role;
  }

  return NextResponse.json({ user: data.user, role });
}
