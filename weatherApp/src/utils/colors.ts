const ENABLED = process.stdout.isTTY && process.env.NO_COLOR === undefined;

const RESET = "\x1b[0m";
const codes = {
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
};

export function paint(text: string, color: keyof typeof codes): string {
  if (!ENABLED) return text;
  return `${codes[color]}${text}${RESET}`;
}