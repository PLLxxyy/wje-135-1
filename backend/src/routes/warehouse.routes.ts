import { Router } from "express";
import { WarehouseController } from "../controllers/warehouse.controller";
import { rbacMiddleware, manageRoles } from "../middlewares/rbac.middleware";

const router = Router();
const controller = new WarehouseController();

router.get("/dashboard", controller.dashboard.bind(controller));
router.get("/permissions", controller.permissions.bind(controller));
router.get("/", controller.list.bind(controller));
router.get("/:id", controller.detail.bind(controller));
router.post("/", rbacMiddleware(manageRoles), controller.create.bind(controller));
router.patch("/:id/status", rbacMiddleware(manageRoles), controller.updateStatus.bind(controller));
router.post("/:id/shelves", rbacMiddleware(manageRoles), controller.addShelf.bind(controller));

export default router;
