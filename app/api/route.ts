import { NextResponse } from "next/server";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwRytE8gk3RWkY653YxcZ-pqKm7zLLosLdW4oyxNBbBzlPmHQhccyiAvWwbSnv8JLB-/exec";

export async function GET() {
  try {
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?t=${Date.now()}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    return NextResponse.json({ success: true, response: text });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to post data" }, { status: 500 });
  }
}