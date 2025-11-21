import { Router } from 'express';
import { DeliveryOrderController } from '../controllers/deliveryOrder.controller';

const router = Router();
const controller = new DeliveryOrderController();

router.get('/', controller.getAll);
router.get('/stats', controller.getStats);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
