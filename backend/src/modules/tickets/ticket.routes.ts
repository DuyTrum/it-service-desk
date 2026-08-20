import { Router } from 'express';
import { TicketController } from './ticket.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
  createTicketSchema,
  updateTicketStatusSchema,
  addCommentSchema,
  closeTicketSchema,
} from './ticket.validation';
import { upload } from '../../middleware/upload.middleware';

const router = Router();
const ticketController = new TicketController();

router.get('/', authenticate, ticketController.getAll);
router.post('/', authenticate, validate(createTicketSchema), ticketController.create);
router.get('/:id', authenticate, ticketController.getById);
router.patch(
  '/:id',
  authenticate,
  authorize(['TECHNICIAN', 'ADMIN']),
  validate(updateTicketStatusSchema),
  ticketController.update
);
router.post(
  '/:id/comments',
  authenticate,
  validate(addCommentSchema),
  ticketController.addComment
);
router.post(
  '/:id/attachments',
  authenticate,
  upload.single('file'),
  ticketController.uploadAttachment
);
router.patch(
  '/:id/close',
  authenticate,
  validate(closeTicketSchema),
  ticketController.closeAndRate
);

export default router;
