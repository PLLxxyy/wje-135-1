import { Request, Response } from "express";
import { StockRecordService } from "../services/stockRecord.service";
import { created, ok } from "../utils/response";

const service = new StockRecordService();

export class StockRecordController {
  async list(req: Request, res: Response) {
    ok(
      res,
      await service.list({
        warehouseId: typeof req.query.warehouseId === "string" ? req.query.warehouseId : undefined,
        productId: typeof req.query.productId === "string" ? req.query.productId : undefined,
        batchNo: typeof req.query.batchNo === "string" ? req.query.batchNo : undefined
      })
    );
  }

  async inbound(req: Request, res: Response) {
    created(
      res,
      await service.inbound({
        product: { connect: { id: req.body.productId } },
        warehouse: { connect: { id: req.body.warehouseId } },
        shelf: req.body.shelfId ? { connect: { id: req.body.shelfId } } : undefined,
        batchNo: req.body.batchNo,
        quantity: Number(req.body.quantity),
        inboundDate: req.body.inboundDate ? new Date(req.body.inboundDate) : new Date(),
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined
      })
    );
  }

  async outbound(req: Request, res: Response) {
    ok(res, await service.outbound(req.params.id, Number(req.body.quantity)));
  }

  async adjust(req: Request, res: Response) {
    ok(res, await service.adjust(req.params.id, Number(req.body.actualQuantity)));
  }

  async transfer(req: Request, res: Response) {
    ok(res, await service.transfer(req.params.id, req.body.targetWarehouseId, req.body.targetShelfId, Number(req.body.quantity)));
  }

  async inventoryReport(req: Request, res: Response) {
    ok(res, await service.inventoryReport(req.params.warehouseId));
  }
}
