import { Router } from "express";
import { StockOrderController } from "../controllers/stockOrder.controller";
import { rbacMiddleware, writeRoles } from "../middlewares/rbac.middleware";

const router = Router();
const controller = new StockOrderController();

router.get("/operation-logs", controller.operationLogs.bind(controller));
router.get("/", controller.list.bind(controller));
router.get("/:id", controller.detail.bind(controller));
router.post("/", rbacMiddleware(writeRoles), controller.create.bind(controller));
router.patch("/:id/status", rbacMiddleware(writeRoles), controller.updateStatus.bind(controller));
router.post("/:id/complete", rbacMiddleware(writeRoles), controller.complete.bind(controller));

export default router;
