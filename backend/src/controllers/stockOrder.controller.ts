import { Request, Response } from "express";
import { StockOrderService } from "../services/stockOrder.service";
import { OperationLogService } from "../services/operationLog.service";
import { OrderStatus, OrderType } from "../types/enums";
import { AuthedRequest } from "../types/interfaces";
import { created, ok } from "../utils/response";

const service = new StockOrderService();
const logService = new OperationLogService();

export class StockOrderController {
  async list(req: Request, res: Response) {
    ok(res, await service.list(typeof req.query.type === "string" ? (req.query.type as OrderType) : undefined));
  }

  async detail(req: Request, res: Response) {
    ok(res, await service.detail(req.params.id));
  }

  async create(req: AuthedRequest, res: Response) {
    created(
      res,
      await service.create({
        type: req.body.type,
        sourceWarehouseId: req.body.sourceWarehouseId,
        targetWarehouseId: req.body.targetWarehouseId,
        createdById: req.user?.id === "system" || !req.user?.id ? req.body.createdById : req.user.id,
        remark: req.body.remark,
        items: req.body.items || []
      })
    );
  }

  async updateStatus(req: AuthedRequest, res: Response) {
    ok(res, await service.updateStatus(req.params.id, req.body.status as OrderStatus, req.user?.id === "system" ? undefined : req.user?.id));
  }

  async complete(req: AuthedRequest, res: Response) {
    ok(res, await service.complete(req.params.id, req.user?.id === "system" ? undefined : req.user?.id));
  }

  async operationLogs(_req: Request, res: Response) {
    ok(res, await logService.list());
  }
}
