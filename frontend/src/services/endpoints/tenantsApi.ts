import { baseApi } from "../baseApi";

export interface Tenant {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}
export interface TenantCreate {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export const tenantsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listTenants: b.query<Tenant[], { search?: string } | void>({
      query: (args) => {
        const search = args && "search" in args ? args.search : undefined;
        const qs = search ? `?search=${encodeURIComponent(search)}` : "";
        return { url: `/tenants${qs}` };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((t) => ({ type: "Tenant" as const, id: t.id })),
              { type: "Tenant" as const, id: "LIST" },
            ]
          : [{ type: "Tenant", id: "LIST" }],
    }),
    createTenant: b.mutation<Tenant, TenantCreate>({
      query: (body) => ({ url: "/tenants", method: "POST", body }),
      invalidatesTags: [{ type: "Tenant", id: "LIST" }],
    }),
    updateTenant: b.mutation<Tenant, { id: number; body: TenantCreate }>({
      query: ({ id, body }) => ({ url: `/tenants/${id}`, method: "PUT", body }),
      invalidatesTags: (_res, _err, arg) => [{ type: "Tenant", id: arg.id }],
    }),
    deleteTenant: b.mutation<void, number>({
      query: (id) => ({ url: `/tenants/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Tenant", id: "LIST" }],
    }),
  }),
});

export const {
  useListTenantsQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useDeleteTenantMutation,
} = tenantsApi;
