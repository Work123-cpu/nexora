export interface PaginatedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface QueryParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}
