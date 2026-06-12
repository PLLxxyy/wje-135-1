import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { rbacMiddleware, writeRoles } from "../middlewares/rbac.middleware";

const router = Router();
const controller = new ProductController();

router.get("/", controller.list.bind(controller));
router.get("/:id", controller.detail.bind(controller));
router.post("/", rbacMiddleware(writeRoles), controller.create.bind(controller));
router.put("/:id", rbacMiddleware(writeRoles), controller.update.bind(controller));

export default router;
