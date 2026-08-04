// Carl Flesch 3-octave major-scale fingerings, and the parser that turns a fingering
// string into tokens for the template.
//
// This is reference data, not page logic — it lives here so the page stays a template.

export type StringFingering = {
  str: "G" | "D" | "A" | "E";
  fingers: string;
};

export type StartOption = {
  startFinger: 0 | 1 | 2 | 3;
  label: string;
  strings: StringFingering[];
};

export type Scale = {
  key: string;
  mode: string;
  options: StartOption[];
};

export const scales: Scale[] = [
  {
    key: "C",
    mode: "major",
    options: [
      {
        startFinger: 3,
        label: "3rd finger (1st position)",
        strings: [
          { str: "G", fingers: "3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2 3 4" },
          { str: "A", fingers: "1 2 3 4 | 1 2 3 4" },
          { str: "E", fingers: "1 2 3 4 | 1 2 3 4" },
        ],
      },
      {
        startFinger: 2,
        label: "2nd finger (2nd position)",
        strings: [
          { str: "G", fingers: "2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2 3" },
          { str: "A", fingers: "0 1 2 3 4 | 1 2 3" },
          { str: "E", fingers: "1 2 3 | 1 2 3 4" },
        ],
      },
      {
        startFinger: 1,
        label: "1st finger (3rd position)",
        strings: [
          { str: "G", fingers: "1 2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2" },
          { str: "A", fingers: "1 2 3 4 | 1 2" },
          { str: "E", fingers: "1 2 3 4 | 1 2 3 4" },
        ],
      },
    ],
  },
  {
    key: "G",
    mode: "major",
    options: [
      {
        startFinger: 0,
        label: "Open string (1st position)",
        strings: [
          { str: "G", fingers: "0 1 2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2 3 4" },
          { str: "A", fingers: "1 2 3 4 | 1 2 3 4" },
          { str: "E", fingers: "1 2 3 4 | 1 2 3 4" },
        ],
      },
      {
        startFinger: 2,
        label: "2nd finger (5th position)",
        strings: [
          { str: "G", fingers: "2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2 3" },
          { str: "A", fingers: "0 1 2 3 4 | 1 2 3" },
          { str: "E", fingers: "1 2 3 | 1 2 3 4" },
        ],
      },
      {
        startFinger: 1,
        label: "1st finger (6th position)",
        strings: [
          { str: "G", fingers: "1 2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2" },
          { str: "A", fingers: "1 2 3 4 | 1 2" },
          { str: "E", fingers: "1 2 3 4 | 1 2 3 4" },
        ],
      },
    ],
  },
  {
    key: "D",
    mode: "major",
    options: [
      {
        startFinger: 0,
        label: "Open string (D string)",
        strings: [
          { str: "D", fingers: "0 1 2 3 4" },
          { str: "A", fingers: "1 2 3 4 | 1 2 3 4" },
          { str: "E", fingers: "1 2 3 4 | 1 2 3 4" },
        ],
      },
      {
        startFinger: 2,
        label: "2nd finger (2nd position)",
        strings: [
          { str: "G", fingers: "4" },
          { str: "D", fingers: "2 3 4 | 1 2 3" },
          { str: "A", fingers: "0 1 2 3 4 | 1 2 3" },
          { str: "E", fingers: "1 2 3 | 1 2 3 4" },
        ],
      },
      {
        startFinger: 1,
        label: "1st finger (3rd position)",
        strings: [
          { str: "G", fingers: "4" },
          { str: "D", fingers: "1 2 3 4 | 1 2" },
          { str: "A", fingers: "1 2 3 4 | 1 2" },
          { str: "E", fingers: "1 2 3 4 | 1 2 3 4" },
        ],
      },
    ],
  },
  {
    key: "A",
    mode: "major",
    options: [
      {
        startFinger: 0,
        label: "Open string (A string)",
        strings: [
          { str: "A", fingers: "0 1 2 3 4" },
          { str: "E", fingers: "1 2 3 4 | 1 2 3 4 | 1 2 3 4" },
        ],
      },
      {
        startFinger: 2,
        label: "2nd finger (2nd position)",
        strings: [
          { str: "D", fingers: "4" },
          { str: "A", fingers: "2 3 4 | 1 2 3" },
          { str: "E", fingers: "0 1 2 3 | 1 2 3 4 | 1 2 3 4" },
        ],
      },
      {
        startFinger: 1,
        label: "1st finger (3rd position)",
        strings: [
          { str: "D", fingers: "4" },
          { str: "A", fingers: "1 2 3 4 | 1 2" },
          { str: "E", fingers: "1 2 3 4 | 1 2 3 4 | 1 2" },
        ],
      },
    ],
  },
  {
    key: "E",
    mode: "major",
    options: [
      {
        startFinger: 0,
        label: "Open string (E string)",
        strings: [
          { str: "E", fingers: "0 1 2 3 4 | 1 2 3 4 | 1 2 3 4 | 1 2 3 4" },
        ],
      },
      {
        startFinger: 2,
        label: "2nd finger (2nd position)",
        strings: [
          { str: "A", fingers: "4" },
          { str: "E", fingers: "2 3 4 | 1 2 3 | 1 2 3 4 | 1 2 3 4" },
        ],
      },
      {
        startFinger: 1,
        label: "1st finger (3rd position)",
        strings: [
          { str: "A", fingers: "4" },
          { str: "E", fingers: "1 2 3 4 | 1 2 3 4 | 1 2 3 4 | 1 2" },
        ],
      },
    ],
  },
  {
    key: "B",
    mode: "major",
    options: [
      {
        startFinger: 2,
        label: "2nd finger (2nd position)",
        strings: [
          { str: "G", fingers: "2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2 3" },
          { str: "A", fingers: "0 1 2 3 4 | 1 2 3" },
          { str: "E", fingers: "1 2 3 | 1 2 3 4" },
        ],
      },
      {
        startFinger: 1,
        label: "1st finger (3rd position)",
        strings: [
          { str: "G", fingers: "1 2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2" },
          { str: "A", fingers: "1 2 3 4 | 1 2" },
          { str: "E", fingers: "1 2 3 4 | 1 2 3 4" },
        ],
      },
    ],
  },
  {
    key: "F♯",
    mode: "major",
    options: [
      {
        startFinger: 2,
        label: "2nd finger (2nd position)",
        strings: [
          { str: "G", fingers: "2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2 3" },
          { str: "A", fingers: "0 1 2 3 4 | 1 2 3" },
          { str: "E", fingers: "1 2 3 | 1 2 3 4" },
        ],
      },
      {
        startFinger: 1,
        label: "1st finger (3rd position)",
        strings: [
          { str: "G", fingers: "1 2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2" },
          { str: "A", fingers: "1 2 3 4 | 1 2" },
          { str: "E", fingers: "1 2 3 4 | 1 2 3 4" },
        ],
      },
    ],
  },
  {
    key: "D♭",
    mode: "major",
    options: [
      {
        startFinger: 2,
        label: "2nd finger (2nd position)",
        strings: [
          { str: "G", fingers: "2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2 3" },
          { str: "A", fingers: "0 1 2 3 4 | 1 2 3" },
          { str: "E", fingers: "1 2 3 | 1 2 3 4" },
        ],
      },
      {
        startFinger: 1,
        label: "1st finger (3rd position)",
        strings: [
          { str: "G", fingers: "1 2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2" },
          { str: "A", fingers: "1 2 3 4 | 1 2" },
          { str: "E", fingers: "1 2 3 4 | 1 2 3 4" },
        ],
      },
    ],
  },
  {
    key: "A♭",
    mode: "major",
    options: [
      {
        startFinger: 2,
        label: "2nd finger (1st position)",
        strings: [
          { str: "G", fingers: "2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2 3" },
          { str: "A", fingers: "0 1 2 3 4 | 1 2 3" },
          { str: "E", fingers: "1 2 3 | 1 2 3 4" },
        ],
      },
      {
        startFinger: 1,
        label: "1st finger (2nd position)",
        strings: [
          { str: "G", fingers: "1 2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2" },
          { str: "A", fingers: "1 2 3 4 | 1 2" },
          { str: "E", fingers: "1 2 3 4 | 1 2 3 4" },
        ],
      },
    ],
  },
  {
    key: "E♭",
    mode: "major",
    options: [
      {
        startFinger: 2,
        label: "2nd finger (2nd position)",
        strings: [
          { str: "G", fingers: "2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2 3" },
          { str: "A", fingers: "0 1 2 3 4 | 1 2 3" },
          { str: "E", fingers: "1 2 3 | 1 2 3 4" },
        ],
      },
      {
        startFinger: 1,
        label: "1st finger (3rd position)",
        strings: [
          { str: "G", fingers: "1 2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2" },
          { str: "A", fingers: "1 2 3 4 | 1 2" },
          { str: "E", fingers: "1 2 3 4 | 1 2 3 4" },
        ],
      },
    ],
  },
  {
    key: "B♭",
    mode: "major",
    options: [
      {
        startFinger: 2,
        label: "2nd finger (2nd position)",
        strings: [
          { str: "G", fingers: "2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2 3" },
          { str: "A", fingers: "0 1 2 3 4 | 1 2 3" },
          { str: "E", fingers: "1 2 3 | 1 2 3 4" },
        ],
      },
      {
        startFinger: 1,
        label: "1st finger (3rd position)",
        strings: [
          { str: "G", fingers: "1 2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2" },
          { str: "A", fingers: "1 2 3 4 | 1 2" },
          { str: "E", fingers: "1 2 3 4 | 1 2 3 4" },
        ],
      },
    ],
  },
  {
    key: "F",
    mode: "major",
    options: [
      {
        startFinger: 2,
        label: "2nd finger (2nd position)",
        strings: [
          { str: "G", fingers: "2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2 3" },
          { str: "A", fingers: "0 1 2 3 4 | 1 2 3" },
          { str: "E", fingers: "1 2 3 | 1 2 3 4" },
        ],
      },
      {
        startFinger: 1,
        label: "1st finger (3rd position)",
        strings: [
          { str: "G", fingers: "1 2 3 4" },
          { str: "D", fingers: "1 2 3 4 | 1 2" },
          { str: "A", fingers: "1 2 3 4 | 1 2" },
          { str: "E", fingers: "1 2 3 4 | 1 2 3 4" },
        ],
      },
    ],
  },
];

export function parseFingers(fingers: string): { type: "finger" | "shift"; value: string }[] {
  return fingers.split(" ").map((token) =>
    token === "|"
      ? { type: "shift", value: "|" }
      : { type: "finger", value: token }
  );
}
