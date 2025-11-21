import prisma from '../config/database';
import { OrderStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

interface FindAllParams {
  status?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  page: number;
  perPage: number;
}

export class DeliveryOrderService {
  async findAll(params: FindAllParams) {
    const { status, startDate, endDate, customerId, page, perPage } = params;

    const where: any = {};

    if (status) {
      where.status = status as OrderStatus;
    }

    if (startDate || endDate) {
      where.requestedDeliveryDate = {};
      if (startDate) {
        where.requestedDeliveryDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.requestedDeliveryDate.lte = new Date(endDate);
      }
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const [orders, total] = await Promise.all([
      prisma.deliveryOrder.findMany({
        where,
        include: {
          customer: true,
          deliveryLocation: true,
          items: true,
        },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: {
          requestedDeliveryDate: 'asc',
        },
      }),
      prisma.deliveryOrder.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async findById(id: string) {
    return prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        deliveryLocation: true,
        items: true,
        routeStops: {
          include: {
            deliveryRoute: {
              include: {
                vehicle: true,
                driver: true,
              },
            },
          },
        },
      },
    });
  }

  async create(data: any) {
    const { items, ...orderData } = data;

    // 合計重量・容積の計算
    const totalWeight = items.reduce((sum: number, item: any) => sum + (item.weight || 0), 0);
    const totalVolume = items.reduce((sum: number, item: any) => sum + (item.volume || 0), 0);

    // 配送依頼番号の生成
    const date = new Date(orderData.requestedDeliveryDate);
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.deliveryOrder.count({
      where: {
        orderNumber: {
          startsWith: `D${dateStr}`,
        },
      },
    });
    const orderNumber = `D${dateStr}-${String(count + 1).padStart(3, '0')}`;

    return prisma.deliveryOrder.create({
      data: {
        ...orderData,
        orderNumber,
        totalWeight,
        totalVolume,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
        customer: true,
        deliveryLocation: true,
      },
    });
  }

  async update(id: string, data: any) {
    const { items, ...orderData } = data;

    const existingOrder = await this.findById(id);
    if (!existingOrder) {
      throw new AppError('配送依頼が見つかりません', 404);
    }

    // アイテムの更新（既存削除→新規作成）
    if (items) {
      await prisma.deliveryItem.deleteMany({
        where: { deliveryOrderId: id },
      });

      const totalWeight = items.reduce((sum: number, item: any) => sum + (item.weight || 0), 0);
      const totalVolume = items.reduce((sum: number, item: any) => sum + (item.volume || 0), 0);

      orderData.totalWeight = totalWeight;
      orderData.totalVolume = totalVolume;
    }

    return prisma.deliveryOrder.update({
      where: { id },
      data: {
        ...orderData,
        ...(items && {
          items: {
            create: items,
          },
        }),
      },
      include: {
        items: true,
        customer: true,
        deliveryLocation: true,
      },
    });
  }

  async delete(id: string) {
    const order = await this.findById(id);
    if (!order) {
      throw new AppError('配送依頼が見つかりません', 404);
    }

    // 割当済みの場合は削除不可
    if (order.status !== 'UNASSIGNED') {
      throw new AppError('割当済みの配送依頼は削除できません', 400);
    }

    return prisma.deliveryOrder.delete({
      where: { id },
    });
  }

  async getStats(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const orders = await prisma.deliveryOrder.findMany({
      where: {
        requestedDeliveryDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const stats = {
      total: orders.length,
      unassigned: orders.filter(o => o.status === 'UNASSIGNED').length,
      planning: orders.filter(o => o.status === 'PLANNING').length,
      assigned: orders.filter(o => o.status === 'ASSIGNED').length,
      inProgress: orders.filter(o => o.status === 'IN_PROGRESS').length,
      completed: orders.filter(o => o.status === 'COMPLETED').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length,
    };

    return stats;
  }
}
