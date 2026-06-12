import { Prisma, WarehouseStatus } from "@prisma/client";
import { prisma } from "../config/database.config";
import { BusinessError } from "../utils/response";

export class WarehouseService {
  async list() {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        manager: true,
        shelves: true,
        stockRecords: { include: { product: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return warehouses.map((warehouse) => ({
      ...warehouse,
      totalQuantity: warehouse.stockRecords.reduce((sum, item) => sum + item.quantity, 0),
      stockValue: warehouse.stockRecords.reduce((sum, item) => sum + item.quantity * Number(item.product.price), 0),
      occupancyRate: this.calculateOccupancy(warehouse.shelves, warehouse.stockRecords)
    }));
  }

  async detail(id: string) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        manager: true,
        shelves: {
          include: {
            stockRecords: { include: { product: true } }
          }
        },
        stockRecords: { include: { product: true, shelf: true } }
      }
    });
    if (!warehouse) {
      throw new BusinessError("仓库不存在", 404);
    }

    return {
      ...warehouse,
      totalQuantity: warehouse.stockRecords.reduce((sum, item) => sum + item.quantity, 0),
      stockValue: warehouse.stockRecords.reduce((sum, item) => sum + item.quantity * Number(item.product.price), 0),
      shelves: warehouse.shelves.map((shelf) => ({
        ...shelf,
        used: shelf.stockRecords.reduce((sum, item) => sum + item.quantity, 0),
        occupancyRate: Math.min(100, Math.round((shelf.stockRecords.reduce((sum, item) => sum + item.quantity, 0) / shelf.capacity) * 100))
      }))
    };
  }

  async create(data: Prisma.WarehouseCreateInput) {
    return prisma.warehouse.create({
      data,
      include: { shelves: true, manager: true }
    });
  }

  async updateStatus(id: string, status: WarehouseStatus) {
    await this.ensureWarehouse(id);
    return prisma.warehouse.update({
      where: { id },
      data: { status },
      include: { shelves: true }
    });
  }

  async addShelf(warehouseId: string, data: { shelfCode: string; levels: number; columns: number; capacity: number }) {
    await this.ensureWarehouse(warehouseId);
    return prisma.shelf.create({ data: { ...data, warehouseId } });
  }

  async dashboard() {
    const [warehouses, lowStockProducts, todaysOrders, completedOrders] = await Promise.all([
      this.list(),
      prisma.product.findMany({ include: { stockRecords: true, category: true }, take: 10 }),
      prisma.stockOrder.count({ where: { createdAt: { gte: startOfToday() } } }),
      prisma.stockOrder.count({ where: { status: "Completed" } })
    ]);

    const alerts = lowStockProducts
      .map((product) => {
        const quantity = product.stockRecords.reduce((sum, item) => sum + item.quantity, 0);
        return { ...product, currentStock: quantity, isLow: quantity < product.minStock };
      })
      .filter((product) => product.isLow)
      .slice(0, 10);

    const stockValueByWarehouse = warehouses.map((warehouse) => ({
      warehouseName: warehouse.name,
      stockValue: warehouse.stockValue,
      totalQuantity: warehouse.totalQuantity
    }));

    return {
      stockValueByWarehouse,
      alerts,
      todaysFlowCount: todaysOrders,
      turnoverRate: completedOrders === 0 ? 0 : Number((completedOrders / Math.max(warehouses.length, 1)).toFixed(2))
    };
  }

  private async ensureWarehouse(id: string) {
    const warehouse = await prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      throw new BusinessError("仓库不存在", 404);
    }
    return warehouse;
  }

  private calculateOccupancy(shelves: { capacity: number }[], stockRecords: { quantity: number }[]) {
    const capacity = shelves.reduce((sum, shelf) => sum + shelf.capacity, 0);
    const used = stockRecords.reduce((sum, item) => sum + item.quantity, 0);
    if (!capacity) {
      return 0;
    }
    return Math.min(100, Math.round((used / capacity) * 100));
  }
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}
