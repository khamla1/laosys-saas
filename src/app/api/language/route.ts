import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { locale } = await request.json();
    const response = NextResponse.json({ success: true });
    
    // Set cookie that lasts for 1 year
    response.cookies.set("NEXT_LOCALE", locale, { 
      path: "/", 
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false // false so client can read it if needed
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
