import { Router } from "express";
import { StockRecordController } from "../controllers/stockRecord.controller";
import { rbacMiddleware, writeRoles } from "../middlewares/rbac.middleware";

const router = Router();
const controller = new StockRecordController();

router.get("/", controller.list.bind(controller));
router.get("/inventory-report/:warehouseId", controller.inventoryReport.bind(controller));
router.post("/inbound", rbacMiddleware(writeRoles), controller.inbound.bind(controller));
router.post("/:id/outbound", rbacMiddleware(writeRoles), controller.outbound.bind(controller));
router.post("/:id/adjust", rbacMiddleware(writeRoles), controller.adjust.bind(controller));
router.post("/:id/transfer", rbacMiddleware(writeRoles), controller.transfer.bind(controller));

export default router;
