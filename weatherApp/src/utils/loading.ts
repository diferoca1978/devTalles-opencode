const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const INTERVAL = 80;

const ENABLED = process.stdout.isTTY && process.env.NO_COLOR === undefined;

export async function withLoading<T>(
  message: string,
  task: () => Promise<T>,
): Promise<T> {
  if (!ENABLED) return task();
  let i = 0;
  const tick = () => {
    const frame = FRAMES[i % FRAMES.length] ?? "";
    i++;
    process.stdout.write(`\r\x1b[2K${frame} ${message}`);
  };
  tick();
  const timer = setInterval(tick, INTERVAL);
  try {
    return await task();
  } finally {
    clearInterval(timer);
    process.stdout.write("\r\x1b[2K");
  }
}