export const SPACE_ENDPOINTS = {
  list: '/api/spaces',
  create: '/api/spaces',
  update: (id: number | string) => `/api/spaces/${id}`,
  delete: (id: number | string) => `/api/spaces/${id}`,
} as const;
