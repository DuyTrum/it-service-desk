import { Router } from 'express';
import { AssetController } from './asset.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createAssetSchema, updateAssetSchema } from './asset.validation';

const router = Router();
const assetController = new AssetController();

router.get('/my-assets', authenticate, assetController.getMyAssets);
router.get('/', authenticate, authorize(['TECHNICIAN', 'ADMIN']), assetController.getAll);
router.get('/:id', authenticate, authorize(['TECHNICIAN', 'ADMIN']), assetController.getById);
router.post('/', authenticate, authorize(['ADMIN']), validate(createAssetSchema), assetController.create);
router.patch('/:id', authenticate, authorize(['TECHNICIAN', 'ADMIN']), validate(updateAssetSchema), assetController.update);

export default router;
