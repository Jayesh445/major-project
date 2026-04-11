import { Router, Request, Response } from 'express';
import { authenticate } from '@/middlewares';
import { asyncHandler, sendSuccess } from '@/utils';
import { generateForPurchaseOrder, generatePngBuffer } from './qr.service';

const router = Router();

// GET /api/qr/po/:poId — returns { qrDataUrl, verifyUrl } JSON
router.get(
  '/po/:poId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { poId } = req.params;
    const eventType = (req.query.type as string) || 'po_created';
    const result = await generateForPurchaseOrder(poId, eventType);
    return sendSuccess(res, result);
  })
);

// GET /api/qr/po/:poId/image — returns raw PNG (for printing on labels)
router.get(
  '/po/:poId/image',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { poId } = req.params;
    const eventType = (req.query.type as string) || 'po_created';
    const buffer = await generatePngBuffer(poId, eventType);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="po-${poId}.png"`);
    res.send(buffer);
  })
);

export default router;
