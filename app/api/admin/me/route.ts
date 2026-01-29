import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = request.cookies.get("admin_session");

  if (!session?.value) {
    return NextResponse.json({ admin: null }, { status: 401 });
  }

  try {
    const admin = JSON.parse(session.value);
    return NextResponse.json({ admin });
  } catch {
    return NextResponse.json({ admin: null }, { status: 401 });
  }
}
