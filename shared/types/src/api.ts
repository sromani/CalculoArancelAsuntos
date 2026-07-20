export type ApiErrorBody = {
  error?: string;
  message?: string | string[];
  statusCode?: number;
};

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  status: number;
  error: string;
  body?: ApiErrorBody;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export type PaginatedQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
};
