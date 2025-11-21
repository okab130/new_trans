import { Request, Response, NextFunction } from 'express';
import { DeliveryOrderService } from '../services/deliveryOrder.service';
import { AppError } from '../middleware/errorHandler';

const deliveryOrderService = new DeliveryOrderService();

export class DeliveryOrderController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        status, 
        startDate, 
        endDate, 
        customerId,
        page = 1,
        perPage = 25 
      } = req.query;

      const result = await deliveryOrderService.findAll({
        status: status as string,
        startDate: startDate as string,
        endDate: endDate as string,
        customerId: customerId as string,
        page: Number(page),
        perPage: Number(perPage),
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await deliveryOrderService.findById(id);

      if (!order) {
        throw new AppError('配送依頼が見つかりません', 404);
      }

      res.json(order);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orderData = req.body;
      const order = await deliveryOrderService.create(orderData);

      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const orderData = req.body;
      
      const order = await deliveryOrderService.update(id, orderData);

      if (!order) {
        throw new AppError('配送依頼が見つかりません', 404);
      }

      res.json(order);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await deliveryOrderService.delete(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;
      const stats = await deliveryOrderService.getStats(date as string);

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}
