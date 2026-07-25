export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiFieldError[] | null;
}

export type NextCursor = {
  createdAt: string;
  id: number;
};

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: NextCursor | null;
  hasNext: boolean;
}
