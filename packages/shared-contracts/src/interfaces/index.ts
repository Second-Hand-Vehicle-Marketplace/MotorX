export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListResponseMeta {
  pagination: PaginationMeta;
}

export interface ApiSuccessResponse<T, M = null> {
  success: true;
  data: T;
  meta: M;
}

export interface ApiErrorResponse {
  success: false;
  error: { code: string; message: string };
  meta: null;
}

export type ApiResponse<T, M = null> = ApiSuccessResponse<T, M> | ApiErrorResponse;
