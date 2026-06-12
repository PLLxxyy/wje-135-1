import morgan from "morgan";

export const requestLoggerMiddleware = morgan(":method :url :status :response-time ms");
