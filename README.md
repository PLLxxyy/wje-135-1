# 多仓库库存管理系统

## Docker 一键启动

```bash
docker compose up --build
```

访问地址：

- 前端：http://localhost:18705
- 后端健康检查：http://localhost:19205/health
- 后端 API 健康检查：http://localhost:19205/api/health

停止并清理容器：

```bash
docker compose down
```

## 本地开发

后端：

```bash
cd backend
npm install
cp ../.env.example .env
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```

前端：

```bash
cd frontend
npm install
npm run dev
```

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | Vue 3、TypeScript、Vite、Element Plus、ECharts、Pinia、Vue Router |
| 后端 | Express、TypeScript、Prisma、JWT、中间件分层 |
| 数据库 | MySQL 8.0 |
| 部署 | Docker Compose、Nginx |

## 目录结构

```text
frontend/src/
├── api/
├── stores/
├── types/
├── components/common/
├── hooks/
├── pages/
├── router/
├── utils/
└── constants/

backend/src/
├── routes/
├── controllers/
├── services/
├── models/
├── middlewares/
├── types/
├── utils/
├── config/
└── prisma/
```

## 核心能力

- 仪表盘：仓库存货金额、库存预警、今日流水、周转率。
- 仓库管理：仓库卡片、库位网格、占用率进度展示。
- 商品管理：分类树、商品搜索、库存分布和阈值预警。
- 出入库管理：单据类型 Tab、动态明细行、状态和操作日志。
- 盘点管理：按仓库加载账面库存，录入实盘数量并校准。
- 横切能力：JWT 鉴权、RBAC 权限控制、操作日志、统一异常响应、前端接口拦截。

## 枚举出现位置

| 枚举 | 后端出现位置 | 前端出现位置 | 说明 |
| --- | --- | --- | --- |
| `OrderType` | `backend/src/types/enums.ts`、`backend/src/prisma/schema.prisma`、`backend/src/services/stockOrder.service.ts`、`backend/src/controllers/stockOrder.controller.ts`、`backend/src/utils/orderNumber.ts`、`backend/src/prisma/seeds/seed.ts` | `frontend/src/types/enums.ts`、`frontend/src/types/order.ts`、`frontend/src/pages/OrderManage.vue`、`frontend/src/components/common/StatusBadge.vue` | 入库、出库、调拨、盘点单据类型 |
| `OrderStatus` | `backend/src/types/enums.ts`、`backend/src/prisma/schema.prisma`、`backend/src/services/stockOrder.service.ts`、`backend/src/controllers/stockOrder.controller.ts`、`backend/src/prisma/seeds/seed.ts` | `frontend/src/types/enums.ts`、`frontend/src/types/order.ts`、`frontend/src/components/common/StatusBadge.vue` | 草稿、提交、处理、完成、取消 |
| `WarehouseStatus` | `backend/src/types/enums.ts`、`backend/src/prisma/schema.prisma`、`backend/src/services/warehouse.service.ts`、`backend/src/controllers/warehouse.controller.ts`、`backend/src/prisma/seeds/seed.ts` | `frontend/src/types/enums.ts`、`frontend/src/types/warehouse.ts`、`frontend/src/pages/WarehouseManage.vue`、`frontend/src/components/common/StatusBadge.vue` | 启用、停用、维护 |
| `OperationType` | `backend/src/types/enums.ts`、`backend/src/prisma/schema.prisma`、`backend/src/services/stockRecord.service.ts`、`backend/src/services/stockOrder.service.ts`、`backend/src/middlewares/auditLog.middleware.ts`、`backend/src/prisma/seeds/seed.ts` | `frontend/src/types/enums.ts`、`frontend/src/types/stock.ts`、`frontend/src/types/order.ts`、`frontend/src/components/common/StatusBadge.vue` | 入库、出库、调整、调拨 |

## License

MIT
