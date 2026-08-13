export function printSeparator(): void {
  console.log("\n─────────────────────────────────────\n");
}

export function prompt(message: string): string | null {
  return globalThis.prompt(message);
}