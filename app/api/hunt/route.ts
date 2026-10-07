import { NextResponse, type NextRequest } from 'next/server';
import { STAGES, COOKIE, allowAttempt, checkAnswer, readProgress, signProgress } from '@/lib/hunt';

/**
 * POST { stage, guess }. Checks the guess on the server. A right answer
 * raises the signed progress cookie and returns the address of the next
 * page; a wrong one returns { ok: false } and nothing else.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!allowAttempt(ip)) return NextResponse.json({ ok: false }, { status: 429 });

  let body: { stage?: unknown; guess?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { stage, guess } = body;
  if (typeof stage !== 'number' || !Number.isInteger(stage) || typeof guess !== 'string' || guess.length > 64) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  // the last stage has no answer; only stages with a page after them can be solved
  if (stage < 0 || stage >= STAGES.length - 1) return NextResponse.json({ ok: false }, { status: 400 });

  const progress = readProgress(req.cookies.get(COOKIE)?.value);
  if (stage > progress) return NextResponse.json({ ok: false }, { status: 403 });
  if (!checkAnswer(stage, guess)) return NextResponse.json({ ok: false });

  const res = NextResponse.json({ ok: true, next: `/rite/${STAGES[stage + 1].slug}` });
  res.cookies.set(COOKIE, signProgress(Math.max(progress, stage + 1)), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}
