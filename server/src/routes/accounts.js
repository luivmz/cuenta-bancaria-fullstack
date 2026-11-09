import { Router } from 'express';
import * as controller from '../controllers/accounts.js';
const router = Router();
router.post('/deposito', controller.deposit);
router.post('/retiro', controller.withdraw);
router.post('/transferencia', controller.transfer);
router.get('/:id/historial', controller.history);
router.get('/:id', controller.account);
export default router;
