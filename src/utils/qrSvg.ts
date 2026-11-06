/**
 * Pure TypeScript Offline QR Code Matrix Generator (ISO/IEC 18004)
 * Generates a scannable QR Code SVG matrix for LAN URLs (up to 53 bytes, ECC Level L, Versions 1-3)
 * Works 100% offline on local home networks without external API calls.
 */

interface QrVersionSpec {
  version: number;
  size: number;
  dataCodewords: number;
  ecCodewords: number;
  alignment: number[];
}

const VERSION_SPECS: QrVersionSpec[] = [
  { version: 1, size: 21, dataCodewords: 19, ecCodewords: 7, alignment: [] },
  { version: 2, size: 25, dataCodewords: 34, ecCodewords: 10, alignment: [6, 18] },
  { version: 3, size: 29, dataCodewords: 55, ecCodewords: 15, alignment: [6, 22] },
  { version: 4, size: 33, dataCodewords: 80, ecCodewords: 20, alignment: [6, 26] },
];

// GF(256) exponent & log tables with primitive polynomial 0x11d
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecLen: number): Uint8Array {
  const gen = rsGeneratorPoly(ecLen);
  const rem = new Uint8Array(ecLen);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0];
    rem.copyWithin(0, 1);
    rem[ecLen - 1] = 0;
    if (factor !== 0) {
      for (let j = 0; j < ecLen; j++) {
        rem[j] ^= gfMul(gen[j + 1], factor);
      }
    }
  }
  return rem;
}

export function generateQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  const spec =
    VERSION_SPECS.find((v) => bytes.length + 2 <= v.dataCodewords) ||
    VERSION_SPECS[VERSION_SPECS.length - 1];

  // Encode byte mode (0100)
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  pushBits(0b0100, 4);
  const maxBytes = Math.min(bytes.length, spec.dataCodewords - 2);
  pushBits(maxBytes, 8);
  for (let i = 0; i < maxBytes; i++) {
    pushBits(bytes[i], 8);
  }

  const maxDataBits = spec.dataCodewords * 8;
  const terminatorLen = Math.min(4, maxDataBits - bits.length);
  pushBits(0, terminatorLen);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataWords = new Uint8Array(spec.dataCodewords);
  for (let i = 0; i < bits.length / 8; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataWords[i] = b;
  }

  const padBytes = [0xec, 0x11];
  for (let i = bits.length / 8, p = 0; i < spec.dataCodewords; i++, p ^= 1) {
    dataWords[i] = padBytes[p];
  }

  const ecWords = rsEncode(dataWords, spec.ecCodewords);
  const allWords = new Uint8Array(dataWords.length + ecWords.length);
  allWords.set(dataWords, 0);
  allWords.set(ecWords, dataWords.length);

  const N = spec.size;
  const modules: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));
  const isFunc: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

  const setModule = (r: number, c: number, dark: boolean, func = true) => {
    if (r >= 0 && r < N && c >= 0 && c < N) {
      modules[r][c] = dark;
      if (func) isFunc[r][c] = true;
    }
  };

  // Finder patterns + separators
  const drawFinder = (r0: number, c0: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = r0 + dr;
        const c = c0 + dc;
        if (r < 0 || r >= N || c < 0 || c >= N) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setModule(r, c, inOuter && (onBorder || inInner), true);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, N - 7);
  drawFinder(N - 7, 0);

  // Timing patterns
  for (let i = 8; i < N - 8; i++) {
    setModule(6, i, i % 2 === 0, true);
    setModule(i, 6, i % 2 === 0, true);
  }

  // Alignment patterns
  if (spec.alignment.length > 0) {
    for (const rCenter of spec.alignment) {
      for (const cCenter of spec.alignment) {
        if (
          (rCenter === 6 && cCenter === 6) ||
          (rCenter === 6 && cCenter === N - 7) ||
          (rCenter === N - 7 && cCenter === 6)
        ) {
          continue;
        }
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
            setModule(rCenter + dr, cCenter + dc, dark, true);
          }
        }
      }
    }
  }

  // Reserve format info areas & dark module
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      isFunc[8][i] = true;
      isFunc[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    isFunc[8][N - 1 - i] = true;
    isFunc[N - 1 - i][8] = true;
  }
  setModule(N - 8, 8, true, true);

  // Place data bits (zigzag upward/downward)
  let bitIdx = 0;
  const totalBits = allWords.length * 8;
  let upward = true;
  for (let right = N - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < N; vert++) {
      const r = upward ? N - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunc[r][c]) {
          let dark = false;
          if (bitIdx < totalBits) {
            dark = ((allWords[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1) !== 0;
            bitIdx++;
          }
          // Apply mask 0: (r + c) % 2 === 0
          if ((r + c) % 2 === 0) dark = !dark;
          modules[r][c] = dark;
        }
      }
    }
    upward = !upward;
  }

  // Write format info for ECC Level L (01) + Mask 0 (000) -> 0x77c4
  const formatBits = 0x77c4;
  for (let i = 0; i <= 5; i++) setModule(8, i, ((formatBits >>> i) & 1) !== 0, true);
  setModule(8, 7, ((formatBits >>> 6) & 1) !== 0, true);
  setModule(8, 8, ((formatBits >>> 7) & 1) !== 0, true);
  setModule(7, 8, ((formatBits >>> 8) & 1) !== 0, true);
  for (let i = 9; i < 15; i++) setModule(14 - i, 8, ((formatBits >>> i) & 1) !== 0, true);

  for (let i = 0; i < 8; i++) setModule(8, N - 1 - i, ((formatBits >>> i) & 1) !== 0, true);
  for (let i = 8; i < 15; i++) setModule(N - 15 + i, 8, ((formatBits >>> i) & 1) !== 0, true);

  return modules;
}
