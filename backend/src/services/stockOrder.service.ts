import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.config";
import { OperationType, OrderStatus, OrderType } from "../types/enums";
import { generateOrderNumber } from "../utils/orderNumber";
import { BusinessError } from "../utils/response";

export class StockOrderService {
  async list(type?: OrderType) {
    return prisma.stockOrder.findMany({
      where: { type },
      include: {
        sourceWarehouse: true,
        targetWarehouse: true,
        createdBy: true,
        approvedBy: true,
        items: { include: { product: true, shelf: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async detail(id: string) {
    const order = await prisma.stockOrder.findUnique({
      where: { id },
      include: {
        sourceWarehouse: true,
        targetWarehouse: true,
        createdBy: true,
        approvedBy: true,
        items: { include: { product: true, shelf: true } },
        operationLogs: { orderBy: { createdAt: "desc" } }
      }
    });
    if (!order) {
      throw new BusinessError("单据不存在", 404);
    }
    return order;
  }

  async create(data: {
    type: OrderType;
    sourceWarehouseId?: string;
    targetWarehouseId?: string;
    createdById: string;
    remark?: string;
    items: { productId: string; shelfId?: string; quantity: number; actualQuantity?: number }[];
  }) {
    if (!data.items.length) {
      throw new BusinessError("单据至少需要一条明细");
    }
    return prisma.stockOrder.create({
      data: {
        orderNo: generateOrderNumber(data.type),
        type: data.type,
        sourceWarehouseId: data.sourceWarehouseId,
        targetWarehouseId: data.targetWarehouseId,
        createdById: data.createdById,
        remark: data.remark,
        items: { create: data.items }
      },
      include: { items: { include: { product: true, shelf: true } }, targetWarehouse: true, sourceWarehouse: true }
    });
  }

  async updateStatus(id: string, status: OrderStatus, approverId?: string) {
    await this.detail(id);
    return prisma.stockOrder.update({
      where: { id },
      data: { status, approvedById: status === OrderStatus.Completed ? approverId : undefined },
      include: { items: true }
    });
  }

  async complete(id: string, approverId?: string) {
    const order = await this.detail(id);
    if (order.status === OrderStatus.Completed) {
      return order;
    }
    return prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (order.type === OrderType.Inbound) {
          if (!order.targetWarehouseId) {
            throw new BusinessError("入库单缺少目标仓库");
          }
          await tx.stockRecord.create({
            data: {
              productId: item.productId,
              warehouseId: order.targetWarehouseId,
              shelfId: item.shelfId,
              batchNo: order.orderNo,
              quantity: item.actualQuantity ?? item.quantity,
              inboundDate: new Date(),
              lastOperationType: OperationType.Inbound
            }
          });
        }
      }

      const updated = await tx.stockOrder.update({
        where: { id },
        data: { status: OrderStatus.Completed, approvedById: approverId },
        include: { items: true }
      });
      await tx.operationLog.create({
        data: {
          operationType: orderOperationType(order.type as OrderType),
          entityType: "StockOrder",
          entityId: order.id,
          orderId: order.id,
          warehouseId: order.targetWarehouseId || order.sourceWarehouseId || undefined,
          operatorId: approverId,
          remark: "单据完成"
        }
      });
      return updated;
    });
  }
}

function orderOperationType(type: OrderType) {
  const map: Record<OrderType, OperationType> = {
    [OrderType.Inbound]: OperationType.Inbound,
    [OrderType.Outbound]: OperationType.Outbound,
    [OrderType.Transfer]: OperationType.Transfer,
    [OrderType.InventoryCheck]: OperationType.Adjust
  };
  return map[type];
}
