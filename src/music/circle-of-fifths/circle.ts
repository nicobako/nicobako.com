// The circle of fifths: the twelve keys, and the geometry of the wheel that shows them.
//
// All of this is build-time work — the page imports `SEGMENTS` and maps it straight to
// SVG, so the wheel ships as static markup and the browser only handles selection.


export const SHARPS = ['F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯', 'B♯'];
export const FLATS  = ['B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭', 'F♭'];

export type KeyData = { major: string; minor: string; sharps: number; flats: number };

export const KEYS: KeyData[] = [
  { major: 'C',   minor: 'Am',   sharps: 0, flats: 0 },
  { major: 'G',   minor: 'Em',   sharps: 1, flats: 0 },
  { major: 'D',   minor: 'Bm',   sharps: 2, flats: 0 },
  { major: 'A',   minor: 'F♯m',  sharps: 3, flats: 0 },
  { major: 'E',   minor: 'C♯m',  sharps: 4, flats: 0 },
  { major: 'B',   minor: 'G♯m',  sharps: 5, flats: 0 },
  { major: 'F♯',  minor: 'D♯m',  sharps: 6, flats: 0 },
  { major: 'D♭',  minor: 'B♭m',  sharps: 0, flats: 5 },
  { major: 'A♭',  minor: 'Fm',   sharps: 0, flats: 4 },
  { major: 'E♭',  minor: 'Cm',   sharps: 0, flats: 3 },
  { major: 'B♭',  minor: 'Gm',   sharps: 0, flats: 2 },
  { major: 'F',   minor: 'Dm',   sharps: 0, flats: 1 },
];

export const KEY_INFO = KEYS.map((k) => ({
  major: k.major,
  minor: k.minor,
  accidentals:
    k.sharps > 0
      ? `${k.sharps} sharp${k.sharps !== 1 ? 's' : ''}: ${SHARPS.slice(0, k.sharps).join(', ')}`
      : k.flats > 0
      ? `${k.flats} flat${k.flats !== 1 ? 's' : ''}: ${FLATS.slice(0, k.flats).join(', ')}`
      : 'No accidentals',
  accLabel: k.sharps > 0 ? `${k.sharps}♯` : k.flats > 0 ? `${k.flats}♭` : '♮',
}));

export const CX = 220;
export const CY = 220;
export const R_OUTER = 215;
export const R_MID1  = 148;
export const R_MID2  = 92;
export const R_INNER = 50;

function toRad(d: number) { return (d * Math.PI) / 180; }

function wedge(r1: number, r2: number, a1Deg: number, a2Deg: number): string {
  const a1 = toRad(a1Deg), a2 = toRad(a2Deg);
  const x1 = CX + r1 * Math.cos(a1), y1 = CY + r1 * Math.sin(a1);
  const x2 = CX + r1 * Math.cos(a2), y2 = CY + r1 * Math.sin(a2);
  const x3 = CX + r2 * Math.cos(a2), y3 = CY + r2 * Math.sin(a2);
  const x4 = CX + r2 * Math.cos(a1), y4 = CY + r2 * Math.sin(a1);
  return `M ${x1} ${y1} A ${r1} ${r1} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${r2} ${r2} 0 0 0 ${x4} ${y4} Z`;
}

function lp(radius: number, deg: number) {
  const rad = toRad(deg);
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

export const SEGMENTS = KEYS.map((_k, i) => {
  const a1 = i * 30 - 90;
  const a2 = a1 + 30;
  const am = a1 + 15;
  return {
    index:     i,
    outerPath: wedge(R_OUTER, R_MID1, a1, a2),
    midPath:   wedge(R_MID1,  R_MID2, a1, a2),
    innerPath: wedge(R_MID2,  R_INNER, a1, a2),
    majorPos:  lp((R_OUTER + R_MID1) / 2, am),
    minorPos:  lp((R_MID1  + R_MID2) / 2, am),
    accPos:    lp((R_MID2  + R_INNER) / 2, am),
    info:      KEY_INFO[i],
  };
});
