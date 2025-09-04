import { baseApi } from "../baseApi";

export interface Lease {
  id: number;
  unitId: number;
  tenantId: number;
  startDateUtc: string;
  endDateUtc: string;
  monthlyRent: number;
  securityDeposit: number;
  isActive: boolean;
}
export interface LeaseCreate
  extends Omit<Lease, "id" | "isActive" | "startDateUtc" | "endDateUtc"> {
  startDateUtc: string; // ISO
  endDateUtc: string;   // ISO
}
export interface LeaseUpdate extends LeaseCreate {
  isActive: boolean;
}

export const leasesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listLeases: b.query<Lease[], { unitId?: number; tenantId?: number; active?: boolean } | void>({
      query: (args) => {
        const p = new URLSearchParams();
        if (args?.unitId) p.set("unitId", String(args.unitId));
        if (args?.tenantId) p.set("tenantId", String(args.tenantId));
        if (typeof args?.active === "boolean") p.set("active", String(args.active));
        const qs = p.toString() ? `?${p.toString()}` : "";
        return { url: `/leases${qs}` };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((l) => ({ type: "Lease" as const, id: l.id })),
              { type: "Lease" as const, id: "LIST" },
            ]
          : [{ type: "Lease", id: "LIST" }],
    }),
    createLease: b.mutation<Lease, LeaseCreate>({
      query: (body) => ({ url: "/leases", method: "POST", body }),
      invalidatesTags: [{ type: "Lease", id: "LIST" }],
    }),
    updateLease: b.mutation<Lease, { id: number; body: LeaseUpdate }>({
      query: ({ id, body }) => ({ url: `/leases/${id}`, method: "PUT", body }),
      invalidatesTags: (_res, _err, arg) => [{ type: "Lease", id: arg.id }],
    }),
    deleteLease: b.mutation<void, number>({
      query: (id) => ({ url: `/leases/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Lease", id: "LIST" }],
    }),
  }),
});

export const {
  useListLeasesQuery,
  useCreateLeaseMutation,
  useUpdateLeaseMutation,
  useDeleteLeaseMutation,
} = leasesApi;
