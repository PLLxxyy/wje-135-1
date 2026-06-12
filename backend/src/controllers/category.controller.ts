import { Request, Response } from "express";
import { CategoryService } from "../services/category.service";
import { created, ok } from "../utils/response";

const service = new CategoryService();

export class CategoryController {
  async list(_req: Request, res: Response) {
    ok(res, await service.list());
  }

  async create(req: Request, res: Response) {
    created(
      res,
      await service.create({
        name: req.body.name,
        sort: req.body.sort || 0,
        icon: req.body.icon,
        parent: req.body.parentId ? { connect: { id: req.body.parentId } } : undefined
      })
    );
  }
}
