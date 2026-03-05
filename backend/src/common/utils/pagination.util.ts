export interface PaginationParams {
  cursor?: string;
  limit?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    cursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

export function buildPaginationQuery(params: PaginationParams) {
  const limit = Math.min(params.limit || 20, 100);
  const orderDir = params.orderDir || 'desc';
  const orderBy = params.orderBy || 'createdAt';

  const query: any = {
    take: limit + 1,
    orderBy: { [orderBy]: orderDir },
  };

  if (params.cursor) {
    query.cursor = { id: params.cursor };
    query.skip = 1;
  }

  return { query, limit };
}

export function buildPaginatedResult<T extends { id: string }>(
  items: T[],
  limit: number,
  total: number,
): PaginatedResult<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const cursor = data.length > 0 ? data[data.length - 1].id : null;

  return {
    data,
    meta: {
      total,
      cursor,
      hasMore,
      limit,
    },
  };
}
