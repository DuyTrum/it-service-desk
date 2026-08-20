import { Request, Response } from 'express';
import { TicketService } from './ticket.service';
import { successResponse, errorResponse } from '../../utils/response';

const ticketService = new TicketService();

export class TicketController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { status, priority, category, assignedTechId, departmentId, search, page, limit } = req.query;
      const result = await ticketService.getTickets(req.user!, {
        status: status as string,
        priority: priority as string,
        category: category as string,
        assignedTechId: assignedTechId as string,
        departmentId: departmentId as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      successResponse(res, result, 'Tickets retrieved successfully');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to fetch tickets', 500);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ticket = await ticketService.getTicketById(id, req.user!);
      successResponse(res, ticket, 'Ticket details retrieved');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to fetch ticket', 404);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const ticket = await ticketService.createTicket(req.user!, req.body);
      successResponse(res, ticket, 'Ticket created successfully', 201);
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to create ticket', 400);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ticket = await ticketService.updateTicket(id, req.user!, req.body);
      successResponse(res, ticket, 'Ticket updated successfully');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to update ticket', 400);
    }
  }

  async addComment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { comment, isInternalNote } = req.body;
      const newComment = await ticketService.addComment(id, req.user!, comment, isInternalNote);
      successResponse(res, newComment, 'Comment posted', 201);
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to add comment', 400);
    }
  }

  async uploadAttachment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!req.file) {
        errorResponse(res, 'No file uploaded', 400);
        return;
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      const attachment = await ticketService.addAttachment(id, req.user!, {
        fileName: req.file.originalname,
        fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      });

      successResponse(res, attachment, 'Attachment uploaded', 201);
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to upload attachment', 400);
    }
  }

  async closeAndRate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { satisfactionRating, feedbackComment } = req.body;
      const ticket = await ticketService.closeAndRate(id, req.user!, satisfactionRating, feedbackComment);
      successResponse(res, ticket, 'Ticket closed and rated successfully');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to close ticket', 400);
    }
  }
}
