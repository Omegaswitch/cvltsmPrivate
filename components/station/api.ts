'use client';

/** The visitor's pass to the station's machine, kept on their device. */
const KEY = 'svartskog-pass';

export const getPass = () => {
  try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; }
};
export const setPass = (p: string) => {
  try { if (p) localStorage.setItem(KEY, p); else localStorage.removeItem(KEY); } catch { /* the pass lasts the visit */ }
};
export const levelOfPass = (p: string) => Number(p.split('.')[0]) || 0;

export type Listing = { name: string; locked: boolean }[];

export async function station<T = Record<string, unknown>>(op: string, args: Record<string, unknown> = {}): Promise<T & { error?: string }> {
  try {
    const res = await fetch('/api/station', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ op, pass: getPass(), ...args }),
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
