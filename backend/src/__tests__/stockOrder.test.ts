import { prisma } from "../config/database.config";
import { StockOrderService } from "../services/stockOrder.service";
import { OrderStatus, OrderType, OperationType, UserRole } from "../types/enums";

const service = new StockOrderService();

async function clearTestData() {
  await prisma.$transaction([
    prisma.operationLog.deleteMany(),
    prisma.stockOrderItem.deleteMany(),
    prisma.stockOrder.deleteMany(),
    prisma.stockRecord.deleteMany()
  ]);
}

async function createTestAdmin() {
  const role = await prisma.role.upsert({
    where: { name: UserRole.Admin },
    update: {},
    create: { name: UserRole.Admin, displayName: "系统管理员" }
  });
  return prisma.user.upsert({
    where: { username: "test-admin" },
    update: {},
    create: { username: "test-admin", displayName: "测试管理员", roleId: role.id }
  });
}

async function createTestWarehouses() {
  const admin = await createTestAdmin();
  const wh1 = await prisma.warehouse.upsert({
    where: { code: "TEST-WH-1" },
    update: {},
    create: {
      name: "测试仓库1",
      code: "TEST-WH-1",
      address: "测试地址1",
      area: 1000,
      managerId: admin.id,
      contactPhone: "13800000001",
      shelves: { create: [{ shelfCode: "T1-A-01", levels: 3, columns: 5, capacity: 500 }] }
    },
    include: { shelves: true }
  });
  const wh2 = await prisma.warehouse.upsert({
    where: { code: "TEST-WH-2" },
    update: {},
    create: {
      name: "测试仓库2",
      code: "TEST-WH-2",
      address: "测试地址2",
      area: 800,
      managerId: admin.id,
      contactPhone: "13800000002",
      shelves: { create: [{ shelfCode: "T2-A-01", levels: 3, columns: 5, capacity: 500 }] }
    },
    include: { shelves: true }
  });
  return { wh1, wh2, admin };
}

async function createTestCategoryAndProduct() {
  const cat = await prisma.category.upsert({
    where: { id: "cat-test" },
    update: {},
    create: { id: "cat-test", name: "测试分类", sort: 99 }
  });
  const prod = await prisma.product.upsert({
    where: { sku: "TEST-SKU-001" },
    update: {},
    create: {
      name: "测试商品A",
      sku: "TEST-SKU-001",
      categoryId: cat.id,
      spec: "规格A",
      unit: "件",
      weight: 0.1,
      volume: 0.001,
      barcode: "TEST000000001",
      minStock: 10,
      maxStock: 1000,
      price: 10
    }
  });
  return { cat, prod };
}

async function sumStock(warehouseId: string, productId: string): Promise<number> {
  const records = await prisma.stockRecord.findMany({
    where: { warehouseId, productId }
  });
  return records.reduce((s, r) => s + r.quantity, 0);
}

describe("StockOrderService - 库存同步集成测试", () => {
  let wh1: any, wh2: any, admin: any, prod: any, shelf1: any, shelf2: any;

  beforeAll(async () => {
    const whs = await createTestWarehouses();
    wh1 = whs.wh1;
    wh2 = whs.wh2;
    admin = whs.admin;
    shelf1 = wh1.shelves[0];
    shelf2 = wh2.shelves[0];
    const { prod: p } = await createTestCategoryAndProduct();
    prod = p;
  });

  beforeEach(async () => {
    await clearTestData();
  });

  describe("场景1: 入库单完成 - 增加库存", () => {
    it("入库单完成后应创建库存记录并增加目标仓库存", async () => {
      const beforeStock = await sumStock(wh1.id, prod.id);
      expect(beforeStock).toBe(0);

      const order = await service.create({
        type: OrderType.Inbound,
        targetWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 100, actualQuantity: 100 }]
      });

      await service.complete(order.id, admin.id);

      const afterStock = await sumStock(wh1.id, prod.id);
      expect(afterStock).toBe(100);

      const records = await prisma.stockRecord.findMany({
        where: { warehouseId: wh1.id, productId: prod.id }
      });
      expect(records.length).toBe(1);
      expect(records[0].quantity).toBe(100);
      expect(records[0].lastOperationType).toBe(OperationType.Inbound);

      const completed = await prisma.stockOrder.findUnique({ where: { id: order.id } });
      expect(completed?.status).toBe(OrderStatus.Completed);
    });

    it("多次入库应累计库存数量", async () => {
      const order1 = await service.create({
        type: OrderType.Inbound,
        targetWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 50, actualQuantity: 50 }]
      });
      await service.complete(order1.id, admin.id);

      const order2 = await service.create({
        type: OrderType.Inbound,
        targetWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 30, actualQuantity: 30 }]
      });
      await service.complete(order2.id, admin.id);

      const afterStock = await sumStock(wh1.id, prod.id);
      expect(afterStock).toBe(80);

      const records = await prisma.stockRecord.findMany({
        where: { warehouseId: wh1.id, productId: prod.id }
      });
      expect(records.length).toBe(2);
    });
  });

  describe("场景2: 出库单完成 - 扣减库存", () => {
    beforeEach(async () => {
      const inbound = await service.create({
        type: OrderType.Inbound,
        targetWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 200, actualQuantity: 200 }]
      });
      await service.complete(inbound.id, admin.id);
    });

    it("出库单完成后应扣减源仓库库存", async () => {
      const beforeStock = await sumStock(wh1.id, prod.id);
      expect(beforeStock).toBe(200);

      const order = await service.create({
        type: OrderType.Outbound,
        sourceWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 80, actualQuantity: 80 }]
      });
      await service.complete(order.id, admin.id);

      const afterStock = await sumStock(wh1.id, prod.id);
      expect(afterStock).toBe(120);

      const records = await prisma.stockRecord.findMany({
        where: { warehouseId: wh1.id, productId: prod.id }
      });
      expect(records[0].quantity).toBe(120);
      expect(records[0].lastOperationType).toBe(OperationType.Outbound);

      const completed = await prisma.stockOrder.findUnique({ where: { id: order.id } });
      expect(completed?.status).toBe(OrderStatus.Completed);
    });

    it("多次出库应累计扣减", async () => {
      const order1 = await service.create({
        type: OrderType.Outbound,
        sourceWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 50, actualQuantity: 50 }]
      });
      await service.complete(order1.id, admin.id);

      const order2 = await service.create({
        type: OrderType.Outbound,
        sourceWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 70, actualQuantity: 70 }]
      });
      await service.complete(order2.id, admin.id);

      const afterStock = await sumStock(wh1.id, prod.id);
      expect(afterStock).toBe(80);
    });

    it("库存不足时应抛出错误且不扣减任何库存", async () => {
      const beforeStock = await sumStock(wh1.id, prod.id);
      expect(beforeStock).toBe(200);

      const order = await service.create({
        type: OrderType.Outbound,
        sourceWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 9999, actualQuantity: 9999 }]
      });

      await expect(service.complete(order.id, admin.id)).rejects.toThrow(/库存不足/);

      const afterStock = await sumStock(wh1.id, prod.id);
      expect(afterStock).toBe(200);

      const failed = await prisma.stockOrder.findUnique({ where: { id: order.id } });
      expect(failed?.status).not.toBe(OrderStatus.Completed);
    });

    it("FIFO策略: 先入库的批次优先被出库", async () => {
      const inbound2 = await service.create({
        type: OrderType.Inbound,
        targetWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 100, actualQuantity: 100 }]
      });
      await service.complete(inbound2.id, admin.id);

      const recordsBefore = await prisma.stockRecord.findMany({
        where: { warehouseId: wh1.id, productId: prod.id },
        orderBy: { inboundDate: "asc" }
      });
      expect(recordsBefore.length).toBe(2);
      const firstBatchId = recordsBefore[0].id;
      const secondBatchId = recordsBefore[1].id;
      expect(recordsBefore[0].quantity).toBe(200);
      expect(recordsBefore[1].quantity).toBe(100);

      const order = await service.create({
        type: OrderType.Outbound,
        sourceWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 250, actualQuantity: 250 }]
      });
      await service.complete(order.id, admin.id);

      const firstAfter = await prisma.stockRecord.findUnique({ where: { id: firstBatchId } });
      const secondAfter = await prisma.stockRecord.findUnique({ where: { id: secondBatchId } });
      expect(firstAfter?.quantity).toBe(0);
      expect(secondAfter?.quantity).toBe(50);
    });
  });

  describe("场景3: 调拨单完成 - 源仓扣减、目标仓增加", () => {
    beforeEach(async () => {
      const inbound = await service.create({
        type: OrderType.Inbound,
        targetWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 150, actualQuantity: 150 }]
      });
      await service.complete(inbound.id, admin.id);
    });

    it("调拨单完成后源仓扣减、目标仓增加", async () => {
      const wh1Before = await sumStock(wh1.id, prod.id);
      const wh2Before = await sumStock(wh2.id, prod.id);
      expect(wh1Before).toBe(150);
      expect(wh2Before).toBe(0);

      const order = await service.create({
        type: OrderType.Transfer,
        sourceWarehouseId: wh1.id,
        targetWarehouseId: wh2.id,
        createdById: admin.id,
        items: [{ productId: prod.id, quantity: 60, actualQuantity: 60 }]
      });
      await service.complete(order.id, admin.id);

      const wh1After = await sumStock(wh1.id, prod.id);
      const wh2After = await sumStock(wh2.id, prod.id);
      expect(wh1After).toBe(90);
      expect(wh2After).toBe(60);

      const sourceRecords = await prisma.stockRecord.findMany({
        where: { warehouseId: wh1.id, productId: prod.id }
      });
      expect(sourceRecords[0].quantity).toBe(90);
      expect(sourceRecords[0].lastOperationType).toBe(OperationType.Transfer);

      const targetRecords = await prisma.stockRecord.findMany({
        where: { warehouseId: wh2.id, productId: prod.id }
      });
      expect(targetRecords.length).toBe(1);
      expect(targetRecords[0].quantity).toBe(60);
      expect(targetRecords[0].lastOperationType).toBe(OperationType.Transfer);

      const completed = await prisma.stockOrder.findUnique({ where: { id: order.id } });
      expect(completed?.status).toBe(OrderStatus.Completed);
    });

    it("多次调拨应正确累计", async () => {
      const order1 = await service.create({
        type: OrderType.Transfer,
        sourceWarehouseId: wh1.id,
        targetWarehouseId: wh2.id,
        createdById: admin.id,
        items: [{ productId: prod.id, quantity: 30, actualQuantity: 30 }]
      });
      await service.complete(order1.id, admin.id);

      const order2 = await service.create({
        type: OrderType.Transfer,
        sourceWarehouseId: wh1.id,
        targetWarehouseId: wh2.id,
        createdById: admin.id,
        items: [{ productId: prod.id, quantity: 50, actualQuantity: 50 }]
      });
      await service.complete(order2.id, admin.id);

      const wh1After = await sumStock(wh1.id, prod.id);
      const wh2After = await sumStock(wh2.id, prod.id);
      expect(wh1After).toBe(70);
      expect(wh2After).toBe(80);
    });

    it("源仓库存不足时调拨失败且不产生任何库存变化", async () => {
      const wh1Before = await sumStock(wh1.id, prod.id);
      const wh2Before = await sumStock(wh2.id, prod.id);

      const order = await service.create({
        type: OrderType.Transfer,
        sourceWarehouseId: wh1.id,
        targetWarehouseId: wh2.id,
        createdById: admin.id,
        items: [{ productId: prod.id, quantity: 9999, actualQuantity: 9999 }]
      });

      await expect(service.complete(order.id, admin.id)).rejects.toThrow(/库存不足/);

      const wh1After = await sumStock(wh1.id, prod.id);
      const wh2After = await sumStock(wh2.id, prod.id);
      expect(wh1After).toBe(wh1Before);
      expect(wh2After).toBe(wh2Before);

      const failed = await prisma.stockOrder.findUnique({ where: { id: order.id } });
      expect(failed?.status).not.toBe(OrderStatus.Completed);
    });

    it("调拨后目标仓再出库能正常扣减", async () => {
      const transfer = await service.create({
        type: OrderType.Transfer,
        sourceWarehouseId: wh1.id,
        targetWarehouseId: wh2.id,
        createdById: admin.id,
        items: [{ productId: prod.id, quantity: 100, actualQuantity: 100 }]
      });
      await service.complete(transfer.id, admin.id);

      const outbound = await service.create({
        type: OrderType.Outbound,
        sourceWarehouseId: wh2.id,
        createdById: admin.id,
        items: [{ productId: prod.id, quantity: 40, actualQuantity: 40 }]
      });
      await service.complete(outbound.id, admin.id);

      const wh2After = await sumStock(wh2.id, prod.id);
      expect(wh2After).toBe(60);
    });
  });

  describe("场景4: 事务与完整性", () => {
    beforeEach(async () => {
      const inbound = await service.create({
        type: OrderType.Inbound,
        targetWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 100, actualQuantity: 100 }]
      });
      await service.complete(inbound.id, admin.id);
    });

    it("单据完成时不更新其他仓库库存", async () => {
      const wh2Before = await sumStock(wh2.id, prod.id);
      const order = await service.create({
        type: OrderType.Outbound,
        sourceWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 30, actualQuantity: 30 }]
      });
      await service.complete(order.id, admin.id);
      const wh2After = await sumStock(wh2.id, prod.id);
      expect(wh2After).toBe(wh2Before);
    });

    it("已完成的单据重复调用complete不产生额外库存变化", async () => {
      const order = await service.create({
        type: OrderType.Outbound,
        sourceWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 20, actualQuantity: 20 }]
      });
      await service.complete(order.id, admin.id);
      const afterFirst = await sumStock(wh1.id, prod.id);

      await service.complete(order.id, admin.id);
      const afterSecond = await sumStock(wh1.id, prod.id);

      expect(afterSecond).toBe(afterFirst);
    });

    it("调拨事务：先扣后加中任一步失败整体回滚", async () => {
      const wh1Before = await sumStock(wh1.id, prod.id);
      const wh2Before = await sumStock(wh2.id, prod.id);

      const order = await service.create({
        type: OrderType.Transfer,
        sourceWarehouseId: wh1.id,
        targetWarehouseId: wh2.id,
        createdById: admin.id,
        items: [{ productId: prod.id, quantity: 99999, actualQuantity: 99999 }]
      });

      await expect(service.complete(order.id, admin.id)).rejects.toThrow(/库存不足/);

      const wh1After = await sumStock(wh1.id, prod.id);
      const wh2After = await sumStock(wh2.id, prod.id);
      expect(wh1After).toBe(wh1Before);
      expect(wh2After).toBe(wh2Before);
    });

    it("操作日志正确记录", async () => {
      const order = await service.create({
        type: OrderType.Outbound,
        sourceWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 25, actualQuantity: 25 }]
      });
      await service.complete(order.id, admin.id);

      const logs = await prisma.operationLog.findMany({
        where: { orderId: order.id },
        orderBy: { createdAt: "asc" }
      });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      const stockLog = logs.find((l) => l.entityType === "StockRecord");
      expect(stockLog).toBeDefined();
      expect(stockLog?.operationType).toBe(OperationType.Outbound);
      expect(stockLog?.productId).toBe(prod.id);
      expect(stockLog?.warehouseId).toBe(wh1.id);
    });
  });

  describe("场景5: 多商品混合单据", () => {
    let prod2: any;

    beforeAll(async () => {
      const p = await prisma.product.upsert({
        where: { sku: "TEST-SKU-002" },
        update: {},
        create: {
          name: "测试商品B",
          sku: "TEST-SKU-002",
          categoryId: "cat-test",
          spec: "规格B",
          unit: "件",
          weight: 0.2,
          volume: 0.002,
          barcode: "TEST000000002",
          minStock: 5,
          maxStock: 500,
          price: 20
        }
      });
      prod2 = p;
    });

    beforeEach(async () => {
      const inbound1 = await service.create({
        type: OrderType.Inbound,
        targetWarehouseId: wh1.id,
        createdById: admin.id,
        items: [
          { productId: prod.id, shelfId: shelf1.id, quantity: 100, actualQuantity: 100 },
          { productId: prod2.id, shelfId: shelf1.id, quantity: 50, actualQuantity: 50 }
        ]
      });
      await service.complete(inbound1.id, admin.id);
    });

    it("出库单多商品均正确扣减", async () => {
      const aBefore = await sumStock(wh1.id, prod.id);
      const bBefore = await sumStock(wh1.id, prod2.id);

      const order = await service.create({
        type: OrderType.Outbound,
        sourceWarehouseId: wh1.id,
        createdById: admin.id,
        items: [
          { productId: prod.id, quantity: 30, actualQuantity: 30 },
          { productId: prod2.id, quantity: 10, actualQuantity: 10 }
        ]
      });
      await service.complete(order.id, admin.id);

      const aAfter = await sumStock(wh1.id, prod.id);
      const bAfter = await sumStock(wh1.id, prod2.id);
      expect(aAfter).toBe(aBefore - 30);
      expect(bAfter).toBe(bBefore - 10);
    });

    it("多商品出库中任一商品库存不足则整体回滚", async () => {
      const aBefore = await sumStock(wh1.id, prod.id);
      const bBefore = await sumStock(wh1.id, prod2.id);

      const order = await service.create({
        type: OrderType.Outbound,
        sourceWarehouseId: wh1.id,
        createdById: admin.id,
        items: [
          { productId: prod.id, quantity: 20, actualQuantity: 20 },
          { productId: prod2.id, quantity: 9999, actualQuantity: 9999 }
        ]
      });

      await expect(service.complete(order.id, admin.id)).rejects.toThrow(/库存不足/);

      const aAfter = await sumStock(wh1.id, prod.id);
      const bAfter = await sumStock(wh1.id, prod2.id);
      expect(aAfter).toBe(aBefore);
      expect(bAfter).toBe(bBefore);
    });

    it("调拨单多商品源仓和目标仓均正确", async () => {
      const order = await service.create({
        type: OrderType.Transfer,
        sourceWarehouseId: wh1.id,
        targetWarehouseId: wh2.id,
        createdById: admin.id,
        items: [
          { productId: prod.id, quantity: 40, actualQuantity: 40 },
          { productId: prod2.id, quantity: 25, actualQuantity: 25 }
        ]
      });
      await service.complete(order.id, admin.id);

      expect(await sumStock(wh1.id, prod.id)).toBe(60);
      expect(await sumStock(wh1.id, prod2.id)).toBe(25);
      expect(await sumStock(wh2.id, prod.id)).toBe(40);
      expect(await sumStock(wh2.id, prod2.id)).toBe(25);
    });
  });

  describe("场景6: 统一入口 - updateStatus(Completed) 与 complete 行为一致", () => {
    beforeEach(async () => {
      const inbound = await service.create({
        type: OrderType.Inbound,
        targetWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 100, actualQuantity: 100 }]
      });
      await service.complete(inbound.id, admin.id);
    });

    it("updateStatus 改为 Completed 时入库单应正确增加库存", async () => {
      const beforeStock = await sumStock(wh1.id, prod.id);

      const order = await service.create({
        type: OrderType.Inbound,
        targetWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 50, actualQuantity: 50 }]
      });
      await service.updateStatus(order.id, OrderStatus.Completed, admin.id);

      const afterStock = await sumStock(wh1.id, prod.id);
      expect(afterStock).toBe(beforeStock + 50);

      const completed = await prisma.stockOrder.findUnique({ where: { id: order.id } });
      expect(completed?.status).toBe(OrderStatus.Completed);
      expect(completed?.approvedById).toBe(admin.id);
    });

    it("updateStatus 改为 Completed 时出库单应正确扣减库存", async () => {
      const beforeStock = await sumStock(wh1.id, prod.id);
      expect(beforeStock).toBe(100);

      const order = await service.create({
        type: OrderType.Outbound,
        sourceWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 30, actualQuantity: 30 }]
      });
      await service.updateStatus(order.id, OrderStatus.Completed, admin.id);

      const afterStock = await sumStock(wh1.id, prod.id);
      expect(afterStock).toBe(70);

      const completed = await prisma.stockOrder.findUnique({ where: { id: order.id } });
      expect(completed?.status).toBe(OrderStatus.Completed);
    });

    it("updateStatus 改为 Completed 时调拨单源减目标增", async () => {
      const wh1Before = await sumStock(wh1.id, prod.id);
      const wh2Before = await sumStock(wh2.id, prod.id);

      const order = await service.create({
        type: OrderType.Transfer,
        sourceWarehouseId: wh1.id,
        targetWarehouseId: wh2.id,
        createdById: admin.id,
        items: [{ productId: prod.id, quantity: 45, actualQuantity: 45 }]
      });
      await service.updateStatus(order.id, OrderStatus.Completed, admin.id);

      const wh1After = await sumStock(wh1.id, prod.id);
      const wh2After = await sumStock(wh2.id, prod.id);
      expect(wh1After).toBe(wh1Before - 45);
      expect(wh2After).toBe(wh2Before + 45);
    });

    it("updateStatus 改为 Completed 时库存不足应回滚", async () => {
      const beforeStock = await sumStock(wh1.id, prod.id);

      const order = await service.create({
        type: OrderType.Outbound,
        sourceWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, quantity: 9999, actualQuantity: 9999 }]
      });

      await expect(
        service.updateStatus(order.id, OrderStatus.Completed, admin.id)
      ).rejects.toThrow(/库存不足/);

      const afterStock = await sumStock(wh1.id, prod.id);
      expect(afterStock).toBe(beforeStock);

      const notCompleted = await prisma.stockOrder.findUnique({ where: { id: order.id } });
      expect(notCompleted?.status).not.toBe(OrderStatus.Completed);
    });

    it("updateStatus 非 Completed 状态不触发库存变化", async () => {
      const beforeStock = await sumStock(wh1.id, prod.id);

      const order = await service.create({
        type: OrderType.Outbound,
        sourceWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, quantity: 20, actualQuantity: 20 }]
      });

      await service.updateStatus(order.id, OrderStatus.Submitted, admin.id);
      expect(await sumStock(wh1.id, prod.id)).toBe(beforeStock);

      await service.updateStatus(order.id, OrderStatus.Processing, admin.id);
      expect(await sumStock(wh1.id, prod.id)).toBe(beforeStock);

      const submitted = await prisma.stockOrder.findUnique({ where: { id: order.id } });
      expect(submitted?.status).toBe(OrderStatus.Processing);
    });

    it("updateStatus(Completed) 与 complete 结果等价", async () => {
      const orderA = await service.create({
        type: OrderType.Outbound,
        sourceWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, quantity: 10, actualQuantity: 10 }]
      });
      await service.complete(orderA.id, admin.id);
      const stockAfterA = await sumStock(wh1.id, prod.id);

      await clearTestData();
      const inbound = await service.create({
        type: OrderType.Inbound,
        targetWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, shelfId: shelf1.id, quantity: 100, actualQuantity: 100 }]
      });
      await service.complete(inbound.id, admin.id);

      const orderB = await service.create({
        type: OrderType.Outbound,
        sourceWarehouseId: wh1.id,
        createdById: admin.id,
        items: [{ productId: prod.id, quantity: 10, actualQuantity: 10 }]
      });
      await service.updateStatus(orderB.id, OrderStatus.Completed, admin.id);
      const stockAfterB = await sumStock(wh1.id, prod.id);

      expect(stockAfterB).toBe(stockAfterA);

      const recA = await prisma.stockOrder.findUnique({ where: { id: orderA.id } });
      const recB = await prisma.stockOrder.findUnique({ where: { id: orderB.id } });
      expect(recA?.status).toBe(recB?.status);
    });
  });
});
