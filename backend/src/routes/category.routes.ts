import { Router } from "express";
import { CategoryController } from "../controllers/category.controller";
import { rbacMiddleware, manageRoles } from "../middlewares/rbac.middleware";

const router = Router();
const controller = new CategoryController();

router.get("/", controller.list.bind(controller));
router.post("/", rbacMiddleware(manageRoles), controller.create.bind(controller));

export default router;
