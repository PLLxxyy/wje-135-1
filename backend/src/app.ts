import cors from "cors";
import express from "express";
import { authMiddleware } from "./middlewares/auth.middleware";
import { auditLogMiddleware } from "./middlewares/auditLog.middleware";
import { errorHandlerMiddleware, notFoundMiddleware } from "./middlewares/errorHandler.middleware";
import { requestLoggerMiddleware } from "./middlewares/requestLogger.middleware";
import categoryRoutes from "./routes/category.routes";
import productRoutes from "./routes/product.routes";
import stockOrderRoutes from "./routes/stockOrder.routes";
import stockRecordRoutes from "./routes/stockRecord.routes";
import warehouseRoutes from "./routes/warehouse.routes";
import { ok } from "./utils/response";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(requestLoggerMiddleware);

  app.get("/health", (_req, res) => ok(res, { status: "ok", service: "warehouse-stock-backend" }));
  app.get("/api/health", (_req, res) => ok(res, { status: "ok", service: "warehouse-stock-backend" }));

  app.use("/api", authMiddleware, auditLogMiddleware);
  app.use("/api/warehouses", warehouseRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/stock-records", stockRecordRoutes);
  app.use("/api/orders", stockOrderRoutes);
  app.use("/api/categories", categoryRoutes);

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
