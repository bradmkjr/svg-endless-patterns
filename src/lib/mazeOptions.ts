import type { MazeDifficulty, MazePaperId } from "./mazeTypes";

const POINTS_PER_INCH = 72;
const inches = (width: number, height: number) => ({
  width: width * POINTS_PER_INCH,
  height: height * POINTS_PER_INCH,
});
const millimeters = (width: number, height: number) => inches(width / 25.4, height / 25.4);

export const MAZE_PAPERS: { id: MazePaperId; label: string; width: number; height: number }[] = [
  { id: "ansiC", label: "ANSI C (17 × 22 in)", ...inches(17, 22) },
  { id: "ansiD", label: "ANSI D (22 × 34 in)", ...inches(22, 34) },
  { id: "ansiE", label: "ANSI E (34 × 44 in)", ...inches(34, 44) },
  { id: "a3", label: "A3 (297 × 420 mm)", ...millimeters(297, 420) },
  { id: "a2", label: "A2 (420 × 594 mm)", ...millimeters(420, 594) },
  { id: "a1", label: "A1 (594 × 841 mm)", ...millimeters(594, 841) },
  { id: "a0", label: "A0 (841 × 1189 mm)", ...millimeters(841, 1189) },
  { id: "2a0", label: "2A0 (1189 × 1682 mm)", ...millimeters(1189, 1682) },
  { id: "4a0", label: "4A0 (1682 × 2378 mm)", ...millimeters(1682, 2378) },
];

const ACROSS: Record<MazeDifficulty, number> = {
  easy: 10,
  medium: 16,
  hard: 24,
  expert: 36,
  master: 60,
  extreme: 100,
};

export const mazeAcross = (difficulty: MazeDifficulty) => ACROSS[difficulty];
export const mazeTallRows = (cols: number) => Math.round(cols * 1.3);
