import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.config";
import { OperationType, OrderStatus, OrderType } from "../types/enums";
import { generateOrderNumber } from "../utils/orderNumber";
import { BusinessError } from "../utils/response";

type PrismaTx = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

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
        } else if (order.type === OrderType.Outbound) {
          if (!order.sourceWarehouseId) {
            throw new BusinessError("出库单缺少源仓库");
          }
          await this.consumeStock(
            tx,
            item.productId,
            order.sourceWarehouseId,
            item.shelfId,
            item.actualQuantity ?? item.quantity,
            order.id,
            OperationType.Outbound
          );
        } else if (order.type === OrderType.Transfer) {
          if (!order.sourceWarehouseId) {
            throw new BusinessError("调拨单缺少源仓库");
          }
          if (!order.targetWarehouseId) {
            throw new BusinessError("调拨单缺少目标仓库");
          }
          const transferQuantity = item.actualQuantity ?? item.quantity;
          await this.consumeStock(
            tx,
            item.productId,
            order.sourceWarehouseId,
            item.shelfId,
            transferQuantity,
            order.id,
            OperationType.Transfer
          );
          await tx.stockRecord.create({
            data: {
              productId: item.productId,
              warehouseId: order.targetWarehouseId,
              batchNo: order.orderNo,
              quantity: transferQuantity,
              inboundDate: new Date(),
              lastOperationType: OperationType.Transfer
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

  private async consumeStock(
    tx: PrismaTx,
    productId: string,
    warehouseId: string,
    shelfId: string | undefined | null,
    quantity: number,
    orderId: string,
    operationType: OperationType
  ) {
    const records = await tx.stockRecord.findMany({
      where: {
        productId,
        warehouseId,
        ...(shelfId ? { shelfId } : {}),
        quantity: { gt: 0 }
      },
      orderBy: { inboundDate: "asc" }
    });
    const totalAvailable = records.reduce((sum, r) => sum + r.quantity, 0);
    if (totalAvailable < quantity) {
      const product = await tx.product.findUnique({ where: { id: productId } });
      throw new BusinessError(
        `商品「${product?.name ?? productId}」库存不足，可用: ${totalAvailable}，需要: ${quantity}`
      );
    }
    let remaining = quantity;
    for (const record of records) {
      if (remaining <= 0) break;
      const deduct = Math.min(record.quantity, remaining);
      await tx.stockRecord.update({
        where: { id: record.id },
        data: {
          quantity: record.quantity - deduct,
          lastOperationType: operationType,
          lastOperationAt: new Date()
        }
      });
      remaining -= deduct;
    }
    await tx.operationLog.create({
      data: {
        operationType,
        entityType: "StockRecord",
        orderId,
        productId,
        warehouseId,
        remark: `${operationType === OperationType.Outbound ? "出库" : "调拨出库"}扣减 ${quantity}`
      }
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
