import { Request, Response } from 'express';
import { AssetService } from './asset.service';
import { successResponse, errorResponse } from '../../utils/response';

const assetService = new AssetService();

export class AssetController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { status, category, departmentId, assignedUserId, search } = req.query;
      const assets = await assetService.getAllAssets({
        status: status as string,
        category: category as string,
        departmentId: departmentId as string,
        assignedUserId: assignedUserId as string,
        search: search as string,
      });
      successResponse(res, assets, 'Assets retrieved successfully');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to fetch assets', 500);
    }
  }

  async getMyAssets(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const assets = await assetService.getMyAssets(userId);
      successResponse(res, assets, 'User assets retrieved');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to fetch user assets', 500);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const asset = await assetService.getAssetById(id);
      successResponse(res, asset, 'Asset details retrieved');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to fetch asset', 404);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const asset = await assetService.createAsset(req.user!, req.body);
      successResponse(res, asset, 'Asset created successfully', 201);
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to create asset', 400);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const asset = await assetService.updateAsset(id, req.user!, req.body);
      successResponse(res, asset, 'Asset updated successfully');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to update asset', 400);
    }
  }
}
