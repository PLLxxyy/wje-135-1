import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { OperationType, OrderStatus, OrderType, UserRole, WarehouseStatus } from "../../types/enums";
import { generateOrderNumber } from "../../utils/orderNumber";

const prisma = new PrismaClient();

async function main() {
  const roles = await Promise.all(
    Object.values(UserRole).map((role) =>
      prisma.role.upsert({
        where: { name: role },
        update: {},
        create: { name: role, displayName: roleDisplayName(role) }
      })
    )
  );

  const adminRole = roles.find((role) => role.name === UserRole.Admin);
  if (!adminRole) {
    throw new Error("Admin role missing");
  }

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      displayName: "系统管理员",
      roleId: adminRole.id
    }
  });

  const electronics = await prisma.category.upsert({
    where: { id: "cat-electronics" },
    update: {},
    create: { id: "cat-electronics", name: "电子元件", sort: 1, icon: "Cpu" }
  });
  const packing = await prisma.category.upsert({
    where: { id: "cat-packing" },
    update: {},
    create: { id: "cat-packing", name: "包装耗材", sort: 2, icon: "Box" }
  });

  const north = await prisma.warehouse.upsert({
    where: { code: "WH-NORTH" },
    update: {},
    create: {
      name: "北区主仓",
      code: "WH-NORTH",
      address: "北京市通州区物流园 1 号",
      area: 3200,
      managerId: admin.id,
      status: WarehouseStatus.Active,
      contactPhone: "010-88008800",
      shelves: {
        create: [
          { shelfCode: "A-01", levels: 4, columns: 8, capacity: 1200 },
          { shelfCode: "A-02", levels: 4, columns: 8, capacity: 1000 },
          { shelfCode: "B-01", levels: 3, columns: 6, capacity: 800 }
        ]
      }
    },
    include: { shelves: true }
  });

  const south = await prisma.warehouse.upsert({
    where: { code: "WH-SOUTH" },
    update: {},
    create: {
      name: "南区冷链仓",
      code: "WH-SOUTH",
      address: "上海市嘉定区仓配路 88 号",
      area: 2100,
      managerId: admin.id,
      status: WarehouseStatus.Maintenance,
      contactPhone: "021-66006600",
      shelves: {
        create: [
          { shelfCode: "C-01", levels: 5, columns: 6, capacity: 600 },
          { shelfCode: "C-02", levels: 5, columns: 6, capacity: 650 }
        ]
      }
    },
    include: { shelves: true }
  });

  const chip = await prisma.product.upsert({
    where: { sku: "SKU-CHIP-001" },
    update: {},
    create: {
      name: "工业控制芯片",
      sku: "SKU-CHIP-001",
      categoryId: electronics.id,
      spec: "IC-2488 / 防静电包装",
      unit: "片",
      weight: 0.02,
      volume: 0.001,
      barcode: "690000000001",
      minStock: 500,
      maxStock: 5000,
      shelfLifeDays: 1095,
      imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475",
      price: 18.5
    }
  });

  const carton = await prisma.product.upsert({
    where: { sku: "SKU-CARTON-220" },
    update: {},
    create: {
      name: "双瓦楞纸箱",
      sku: "SKU-CARTON-220",
      categoryId: packing.id,
      spec: "220x180x120mm",
      unit: "个",
      weight: 0.12,
      volume: 0.004,
      barcode: "690000000220",
      minStock: 800,
      maxStock: 8000,
      imageUrl: "https://images.unsplash.com/photo-1607166452427-7e4477079cb9",
      price: 2.2
    }
  });

  const firstNorthShelf = north.shelves[0];
  const firstSouthShelf = south.shelves[0];

  await prisma.stockRecord.upsert({
    where: { id: "stock-chip-north" },
    update: {},
    create: {
      id: "stock-chip-north",
      productId: chip.id,
      warehouseId: north.id,
      shelfId: firstNorthShelf.id,
      batchNo: "BATCH-240601",
      quantity: 420,
      inboundDate: new Date("2026-06-01T00:00:00.000Z"),
      expiryDate: new Date("2029-06-01T00:00:00.000Z"),
      lastOperationType: OperationType.Inbound
    }
  });

  await prisma.stockRecord.upsert({
    where: { id: "stock-carton-south" },
    update: {},
    create: {
      id: "stock-carton-south",
      productId: carton.id,
      warehouseId: south.id,
      shelfId: firstSouthShelf.id,
      batchNo: "BATCH-240620",
      quantity: 3200,
      inboundDate: new Date("2026-06-02T00:00:00.000Z"),
      lastOperationType: OperationType.Transfer
    }
  });

  const existingOrder = await prisma.stockOrder.findFirst({ where: { orderNo: { startsWith: "IN-" } } });
  if (!existingOrder) {
    await prisma.stockOrder.create({
      data: {
        orderNo: generateOrderNumber(OrderType.Inbound),
        type: OrderType.Inbound,
        targetWarehouseId: north.id,
        status: OrderStatus.Completed,
        createdById: admin.id,
        approvedById: admin.id,
        remark: "期初入库演示单",
        items: {
          create: [{ productId: chip.id, shelfId: firstNorthShelf.id, quantity: 420, actualQuantity: 420 }]
        }
      }
    });
  }
}

function roleDisplayName(role: UserRole) {
  const names: Record<UserRole, string> = {
    [UserRole.Admin]: "系统管理员",
    [UserRole.WarehouseManager]: "仓库经理",
    [UserRole.Operator]: "作业员",
    [UserRole.Viewer]: "只读访客"
  };
  return names[role];
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
