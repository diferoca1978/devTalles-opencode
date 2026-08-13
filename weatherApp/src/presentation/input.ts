export function prompt(message: string): string | null {
  return globalThis.prompt(message);
}

export function readSelection(input: string | null): number {
  return input ? Number.parseInt(input, 10) - 1 : NaN;
}