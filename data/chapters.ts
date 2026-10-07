/**
 * The chapters, in order. The ids are the section anchors; the labels are what
 * the chapter indicator and the index show. The narrative runs:
 * ORDER → DISCOVERY → DISSECTION → RITUAL → CONTAMINATION → ORDER
 */
export interface Chapter {
  id: string;
  label: string;
  nav?: string;           // the words shown in the top navigation, if any
  tone: 'black' | 'bone'; // the colour the chrome takes while this chapter is on screen
}

export const CHAPTERS: Chapter[] = [
  { id: 'discovery', label: 'DISCOVERY', tone: 'black' },
  { id: 'object', label: 'THE OBJECT', nav: 'OBJECT', tone: 'bone' },
  { id: 'anatomy', label: 'ANATOMY', nav: 'ANATOMY', tone: 'black' },
  { id: 'sigils', label: 'SIGILS', nav: 'SIGILS', tone: 'black' },
  { id: 'ritual', label: 'RITUAL', tone: 'black' },
  { id: 'archive', label: 'ARCHIVE', nav: 'ARCHIVE', tone: 'black' },
  { id: 'set', label: 'THE SET', nav: 'SET', tone: 'bone' },
  { id: 'void', label: 'VOID', tone: 'black' },
  { id: 'complete', label: 'COMPLETE', tone: 'black' },
];
