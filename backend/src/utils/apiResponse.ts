export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function success<T>(data: T, meta?: Record<string, unknown>) {
  return {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
}

export function paginated<T>(data: T[], total: number, page: number, limit: number) {
  return {
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}
