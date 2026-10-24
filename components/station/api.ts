'use client';

/** The visitor's session with the station's machine, kept on their device. Their progress is in the register. */
const KEY = 'svartskog-session';

export const getSession = () => {
  try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; }
};
export const setSession = (s: string) => {
  try { if (s) localStorage.setItem(KEY, s); else localStorage.removeItem(KEY); } catch { /* the session lasts the visit */ }
};

export type Listing = { name: string; locked: boolean }[];

export async function station<T = Record<string, unknown>>(op: string, args: Record<string, unknown> = {}): Promise<T & { error?: string }> {
  try {
    const res = await fetch('/api/station', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ op, session: getSession(), ...args }),
    });
    return await res.json();
  } catch {
    return { error: 'no carrier' } as T & { error: string };
  }
}

/** The sealed files and the locks that open them. */
export const SEALED: Record<string, 'stone' | 'date' | 'carrier'> = {
  'journal_04.enc': 'stone',
  'anomaly_01.log': 'date',
  'transcript.txt': 'carrier',
};

export const CLEARANCE = ['GUEST', 'OBSERVER', 'ANALYST', 'RECEIVER', 'DIRECTOR'];
