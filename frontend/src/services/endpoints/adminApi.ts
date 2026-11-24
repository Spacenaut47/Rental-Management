import { baseApi } from "../baseApi";

export type AuditItem = {
  id: number;
  actor: string;
  action: string;
  entityName: string;
  entityId?: number | null;
  details?: string | null;
  atUtc: string;
};

export type AuditResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: AuditItem[];
};

export const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAudit: build.query<
      AuditResponse,
      { page: number; pageSize: number; entity?: string }
    >({
      query: ({ page, pageSize, entity }) => {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });
        if (entity) params.set("entity", entity);
        return { url: `/admin/audit?${params.toString()}` };
      },
      providesTags: ["Audit"],
    }),
  }),
});

export const { useListAuditQuery } = adminApi;
