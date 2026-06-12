import { Request, Response } from "express";
import { WarehouseStatus } from "@prisma/client";
import { WarehouseService } from "../services/warehouse.service";
import { UserRole } from "../types/enums";
import { AuthedRequest } from "../types/interfaces";
import { created, ok } from "../utils/response";

const service = new WarehouseService();

export class WarehouseController {
  async list(_req: Request, res: Response) {
    ok(res, await service.list());
  }

  async detail(req: Request, res: Response) {
    ok(res, await service.detail(req.params.id));
  }

  async create(req: AuthedRequest, res: Response) {
    const userId = req.user?.id === "system" ? undefined : req.user?.id;
    created(
      res,
      await service.create({
        name: req.body.name,
        code: req.body.code,
        address: req.body.address,
        area: req.body.area,
        contactPhone: req.body.contactPhone,
        status: req.body.status || WarehouseStatus.Active,
        manager: userId ? { connect: { id: userId } } : undefined,
        shelves: {
          create: req.body.shelves || []
        }
      })
    );
  }

  async updateStatus(req: Request, res: Response) {
    ok(res, await service.updateStatus(req.params.id, req.body.status));
  }

  async addShelf(req: Request, res: Response) {
    created(res, await service.addShelf(req.params.id, req.body));
  }

  async dashboard(_req: Request, res: Response) {
    ok(res, await service.dashboard());
  }

  async permissions(req: AuthedRequest, res: Response) {
    const role = req.user?.role || UserRole.Viewer;
    ok(res, {
      role,
      canWrite: [UserRole.Admin, UserRole.WarehouseManager, UserRole.Operator].includes(role),
      canManageWarehouse: [UserRole.Admin, UserRole.WarehouseManager].includes(role)
    });
  }
}
