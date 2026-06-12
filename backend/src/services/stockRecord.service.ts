import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.config";
import { OperationType } from "../types/enums";
import { BusinessError } from "../utils/response";

export class StockRecordService {
  async list(query: { warehouseId?: string; productId?: string; batchNo?: string }) {
    return prisma.stockRecord.findMany({
      where: {
        warehouseId: query.warehouseId,
        productId: query.productId,
        batchNo: query.batchNo ? { contains: query.batchNo } : undefined
      },
      include: { product: true, warehouse: true, shelf: true },
      orderBy: { lastOperationAt: "desc" }
    });
  }

  async inbound(data: Prisma.StockRecordCreateInput) {
    const record = await prisma.stockRecord.create({ data });
    await this.logStockOperation(record.id, OperationType.Inbound, "入库新增库存记录");
    return record;
  }

  async outbound(recordId: string, quantity: number) {
    const record = await prisma.stockRecord.findUnique({ where: { id: recordId } });
    if (!record) {
      throw new BusinessError("库存记录不存在", 404);
    }
    if (record.quantity < quantity) {
      throw new BusinessError("库存不足，无法出库");
    }
    const updated = await prisma.stockRecord.update({
      where: { id: recordId },
      data: { quantity: record.quantity - quantity, lastOperationType: OperationType.Outbound, lastOperationAt: new Date() }
    });
    await this.logStockOperation(recordId, OperationType.Outbound, `出库 ${quantity}`);
    return updated;
  }

  async adjust(recordId: string, actualQuantity: number) {
    const record = await prisma.stockRecord.findUnique({ where: { id: recordId } });
    if (!record) {
      throw new BusinessError("库存记录不存在", 404);
    }
    const updated = await prisma.stockRecord.update({
      where: { id: recordId },
      data: { quantity: actualQuantity, lastOperationType: OperationType.Adjust, lastOperationAt: new Date() }
    });
    await this.logStockOperation(recordId, OperationType.Adjust, `盘点校准为 ${actualQuantity}`);
    return updated;
  }

  async transfer(recordId: string, targetWarehouseId: string, targetShelfId: string | undefined, quantity: number) {
    return prisma.$transaction(async (tx) => {
      const source = await tx.stockRecord.findUnique({ where: { id: recordId } });
      if (!source) {
        throw new BusinessError("库存记录不存在", 404);
      }
      if (source.quantity < quantity) {
        throw new BusinessError("库存不足，无法调拨");
      }

      const updatedSource = await tx.stockRecord.update({
        where: { id: recordId },
        data: { quantity: source.quantity - quantity, lastOperationType: OperationType.Transfer, lastOperationAt: new Date() }
      });
      const target = await tx.stockRecord.create({
        data: {
          productId: source.productId,
          warehouseId: targetWarehouseId,
          shelfId: targetShelfId,
          batchNo: source.batchNo,
          quantity,
          inboundDate: new Date(),
          expiryDate: source.expiryDate,
          lastOperationType: OperationType.Transfer
        }
      });
      await tx.operationLog.create({
        data: {
          operationType: OperationType.Transfer,
          entityType: "StockRecord",
          entityId: recordId,
          productId: source.productId,
          warehouseId: targetWarehouseId,
          remark: `调拨 ${quantity}`
        }
      });
      return { source: updatedSource, target };
    });
  }

  async inventoryReport(warehouseId: string) {
    const records = await this.list({ warehouseId });
    return records.map((record) => ({
      recordId: record.id,
      productName: record.product.name,
      sku: record.product.sku,
      shelfCode: record.shelf?.shelfCode || "未分配",
      bookQuantity: record.quantity,
      actualQuantity: record.quantity,
      difference: 0
    }));
  }

  private async logStockOperation(stockRecordId: string, operationType: OperationType, remark: string) {
    const record = await prisma.stockRecord.findUnique({ where: { id: stockRecordId } });
    if (!record) {
      return;
    }
    await prisma.operationLog.create({
      data: {
        operationType,
        entityType: "StockRecord",
        entityId: stockRecordId,
        warehouseId: record.warehouseId,
        productId: record.productId,
        remark
      }
    });
  }
}
