import { Request } from 'express';
import { config } from '../config';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function getPagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(
    config.pagination.maxLimit,
    Math.max(1, parseInt(req.query.limit as string) || config.pagination.defaultLimit),
  );
  return { page, limit, skip: (page - 1) * limit };
}

export function getSort(req: Request, allowedFields: string[], defaultField: string = 'createdAt', defaultDir: 'asc' | 'desc' = 'desc') {
  const sortField = (req.query.sortBy as string) || defaultField;
  const sortDir = (req.query.sortDir as string) === 'asc' ? 'asc' : defaultDir;

  if (!allowedFields.includes(sortField)) {
    return { [defaultField]: defaultDir };
  }

  return { [sortField]: sortDir };
}

export function getSearchFilter(req: Request, fields: string[]): Record<string, any> | undefined {
  const search = (req.query.search as string)?.trim();
  if (!search) return undefined;

  return {
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: 'insensitive' },
    })),
  };
}
