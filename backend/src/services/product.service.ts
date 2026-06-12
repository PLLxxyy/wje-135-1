import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.config";
import { BusinessError } from "../utils/response";

export class ProductService {
  async list(query: { keyword?: string; categoryId?: string }) {
    const where: Prisma.ProductWhereInput = {
      AND: [
        query.keyword
          ? {
              OR: [
                { name: { contains: query.keyword } },
                { sku: { contains: query.keyword } },
                { barcode: { contains: query.keyword } }
              ]
            }
          : {},
        query.categoryId ? { categoryId: query.categoryId } : {}
      ]
    };

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        stockRecords: { include: { warehouse: true, shelf: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return products.map((product) => ({
      ...product,
      totalStock: product.stockRecords.reduce((sum, item) => sum + item.quantity, 0),
      stockWarning: product.stockRecords.reduce((sum, item) => sum + item.quantity, 0) < product.minStock
    }));
  }

  async detail(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stockRecords: { include: { warehouse: true, shelf: true } },
        orderItems: { include: { order: true }, orderBy: { createdAt: "desc" }, take: 10 }
      }
    });
    if (!product) {
      throw new BusinessError("商品不存在", 404);
    }
    return {
      ...product,
      totalStock: product.stockRecords.reduce((sum, item) => sum + item.quantity, 0)
    };
  }

  async create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data, include: { category: true } });
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    await this.detail(id);
    return prisma.product.update({ where: { id }, data, include: { category: true } });
  }
}
