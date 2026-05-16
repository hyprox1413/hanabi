export const COLORS = ["Red", "Yellow", "Green", "Blue", "Purple"];
export const COLOR_MAP: Record<number, string> = {
  0: "#ef5350",
  1: "#fbc02d",
  2: "#66bb6a",
  3: "#42a5f5",
  4: "#ab47bc",
};

export const getCardColor = (colorIndex: number): string => {
  return COLOR_MAP[colorIndex] || "#999";
};
