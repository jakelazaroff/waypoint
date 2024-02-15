export const COLORS = [
  "#FF5C5C",
  "#FFB65C",
  "#FAFF70",
  "#88FF70",
  "#47F0FF",
  "#478EFF",
  "#745CFF",
  "#FF85FF"
];

export function choose<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}
