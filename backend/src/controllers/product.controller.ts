import { Request, Response } from "express";
import { ProductService } from "../services/product.service";
import { created, ok } from "../utils/response";

const service = new ProductService();

export class ProductController {
  async list(req: Request, res: Response) {
    ok(
      res,
      await service.list({
        keyword: typeof req.query.keyword === "string" ? req.query.keyword : undefined,
        categoryId: typeof req.query.categoryId === "string" ? req.query.categoryId : undefined
      })
    );
  }

  async detail(req: Request, res: Response) {
    ok(res, await service.detail(req.params.id));
  }

  async create(req: Request, res: Response) {
    created(
      res,
      await service.create({
        name: req.body.name,
        sku: req.body.sku,
        category: { connect: { id: req.body.categoryId } },
        spec: req.body.spec,
        unit: req.body.unit,
        weight: req.body.weight,
        volume: req.body.volume,
        barcode: req.body.barcode,
        minStock: req.body.minStock,
        maxStock: req.body.maxStock,
        shelfLifeDays: req.body.shelfLifeDays,
        imageUrl: req.body.imageUrl,
        price: req.body.price || 0
      })
    );
  }

  async update(req: Request, res: Response) {
    ok(res, await service.update(req.params.id, req.body));
  }
}
