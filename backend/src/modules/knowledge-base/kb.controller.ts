import { Request, Response } from 'express';
import { KnowledgeBaseService } from './kb.service';
import { successResponse, errorResponse } from '../../utils/response';

const kbService = new KnowledgeBaseService();

export class KnowledgeBaseController {
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await kbService.getCategories();
      successResponse(res, categories, 'Categories retrieved');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to fetch categories', 500);
    }
  }

  async search(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId, search } = req.query;
      const articles = await kbService.searchArticles({
        categoryId: categoryId as string,
        search: search as string,
      });
      successResponse(res, articles, 'Articles retrieved');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to search articles', 500);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const article = await kbService.getArticleById(id);
      successResponse(res, article, 'Article details retrieved');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to fetch article', 404);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const article = await kbService.createArticle(req.user!, req.body);
      successResponse(res, article, 'Article created successfully', 201);
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to create article', 400);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const article = await kbService.updateArticle(id, req.body);
      successResponse(res, article, 'Article updated successfully');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to update article', 400);
    }
  }
}
