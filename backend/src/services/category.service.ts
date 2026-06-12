import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.config";

export class CategoryService {
  async list() {
    const categories = await prisma.category.findMany({ include: { products: true }, orderBy: [{ sort: "asc" }, { createdAt: "asc" }] });
    const byParent = new Map<string | null, typeof categories>();
    for (const category of categories) {
      const key = category.parentId ?? null;
      byParent.set(key, [...(byParent.get(key) || []), category]);
    }
    const build = (parentId: string | null): unknown[] =>
      (byParent.get(parentId) || []).map((category) => ({
        ...category,
        productCount: category.products.length,
        children: build(category.id)
      }));
    return build(null);
  }

  async create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
  }
}
