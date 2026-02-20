import { Router } from 'express';
import { authenticate } from '@/middlewares';
import {
  getAdminStats,
  getWarehouseStats,
  getProcurementStats,
  getAgentStats,
} from './dashboard.controller';

const router = Router();

router.get('/admin-stats', authenticate, getAdminStats);
router.get('/warehouse-stats', authenticate, getWarehouseStats);
router.get('/procurement-stats', authenticate, getProcurementStats);
router.get('/agent-stats', authenticate, getAgentStats);

export default router;
