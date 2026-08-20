import { query } from '../../config/db';
import { AuthUserPayload } from '../../types';

export class KnowledgeBaseService {
  async getCategories() {
    const res = await query(
      `SELECT c.*, (SELECT COUNT(*) FROM knowledge_base WHERE category_id = c.id AND is_published = TRUE) as article_count
       FROM knowledge_categories c
       ORDER BY c.name ASC`
    );
    return res.rows;
  }

  async searchArticles(params: {
    categoryId?: string;
    search?: string;
  }) {
    let sql = `
      SELECT kb.id, kb.title, kb.category_id, c.name as category_name, c.icon as category_icon,
             kb.problem_description, kb.symptoms, kb.view_count, kb.created_at, kb.updated_at
      FROM knowledge_base kb
      JOIN knowledge_categories c ON kb.category_id = c.id
      WHERE kb.is_published = TRUE
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    if (params.categoryId) {
      sql += ` AND kb.category_id = $${paramIndex++}`;
      queryParams.push(params.categoryId);
    }

    if (params.search) {
      sql += ` AND (kb.title ILIKE $${paramIndex} OR kb.problem_description ILIKE $${paramIndex} OR kb.symptoms ILIKE $${paramIndex} OR kb.possible_causes ILIKE $${paramIndex})`;
      queryParams.push(`%${params.search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY kb.view_count DESC, kb.created_at DESC`;

    const res = await query(sql, queryParams);
    return res.rows;
  }

  async getArticleById(id: string) {
    // Increment view count
    await query(`UPDATE knowledge_base SET view_count = view_count + 1 WHERE id = $1`, [id]);

    const res = await query(
      `SELECT kb.*, c.name as category_name, c.icon as category_icon,
              u.full_name as author_name
       FROM knowledge_base kb
       JOIN knowledge_categories c ON kb.category_id = c.id
       LEFT JOIN users u ON kb.author_id = u.id
       WHERE kb.id = $1`,
      [id]
    );

    if (res.rows.length === 0) {
      throw new Error('Knowledge Base article not found');
    }

    return res.rows[0];
  }

  async createArticle(user: AuthUserPayload, data: {
    title: string;
    categoryId: string;
    problemDescription: string;
    symptoms?: string;
    possibleCauses?: string;
    troubleshootingSteps: string[];
    escalationCondition?: string;
  }) {
    const res = await query(
      `INSERT INTO knowledge_base (
         title, category_id, problem_description, symptoms, possible_causes,
         troubleshooting_steps, escalation_condition, author_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.title,
        data.categoryId,
        data.problemDescription,
        data.symptoms || null,
        data.possibleCauses || null,
        JSON.stringify(data.troubleshootingSteps || []),
        data.escalationCondition || null,
        user.id,
      ]
    );

    return res.rows[0];
  }

  async updateArticle(id: string, data: any) {
    const res = await query(
      `UPDATE knowledge_base SET
         title = COALESCE($1, title),
         category_id = COALESCE($2, category_id),
         problem_description = COALESCE($3, problem_description),
         symptoms = COALESCE($4, symptoms),
         possible_causes = COALESCE($5, possible_causes),
         troubleshooting_steps = CASE WHEN $6::jsonb IS NOT NULL THEN $6::jsonb ELSE troubleshooting_steps END,
         escalation_condition = COALESCE($7, escalation_condition),
         is_published = COALESCE($8, is_published),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        data.title || null,
        data.categoryId || null,
        data.problemDescription || null,
        data.symptoms || null,
        data.possibleCauses || null,
        data.troubleshootingSteps ? JSON.stringify(data.troubleshootingSteps) : null,
        data.escalationCondition || null,
        data.isPublished !== undefined ? data.isPublished : null,
        id,
      ]
    );

    if (res.rows.length === 0) {
      throw new Error('Knowledge Base article not found');
    }

    return res.rows[0];
  }
}
