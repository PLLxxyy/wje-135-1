type LogPayload = Record<string, unknown> | string | undefined;

function write(level: "info" | "warn" | "error", message: string, payload?: LogPayload) {
  const entry = { level, message, payload, time: new Date().toISOString() };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const logger = {
  info: (message: string, payload?: LogPayload) => write("info", message, payload),
  warn: (message: string, payload?: LogPayload) => write("warn", message, payload),
  error: (message: string, payload?: LogPayload) => write("error", message, payload)
};
