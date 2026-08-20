import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum([
    'Hardware',
    'Software',
    'Network',
    'Printer',
    'Account & Access',
    'Email',
    'Other',
  ]),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  assetId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum([
    'Open',
    'Assigned',
    'In Progress',
    'Waiting for User',
    'Resolved',
    'Closed',
  ]).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  assignedTechId: z.string().uuid().optional().nullable(),
  resolutionNotes: z.string().optional(),
  rootCause: z.string().optional(),
  comment: z.string().optional(),
});

export const addCommentSchema = z.object({
  comment: z.string().min(1, 'Comment cannot be empty'),
  isInternalNote: z.boolean().default(false),
});

export const closeTicketSchema = z.object({
  satisfactionRating: z.number().int().min(1).max(5),
  feedbackComment: z.string().optional(),
});
