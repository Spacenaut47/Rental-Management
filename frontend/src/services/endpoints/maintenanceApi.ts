import { baseApi } from "../baseApi";

export interface MaintenanceItem {
  id: number;
  propertyId: number;
  unitId?: number | null;
  tenantId?: number | null;
  title: string;
  description?: string | null;
  priority: number; // enum
  status: number;   // enum
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}
export interface MaintenanceCreate {
  propertyId: number;
  unitId?: number;
  tenantId?: number;
  title: string;
  description?: string;
  priority: number;
}
export interface MaintenanceUpdate {
  title: string;
  description?: string;
  priority: number;
  status: number;
}

export const maintenanceApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listMaintenance: b.query<MaintenanceItem[], { propertyId?: number; unitId?: number; tenantId?: number } | void>({
      query: (args) => {
        const p = new URLSearchParams();
        if (args?.propertyId) p.set("propertyId", String(args.propertyId));
        if (args?.unitId) p.set("unitId", String(args.unitId));
        if (args?.tenantId) p.set("tenantId", String(args.tenantId));
        const qs = p.toString() ? `?${p.toString()}` : "";
        return { url: `/maintenance${qs}` };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((m) => ({ type: "Maintenance" as const, id: m.id })),
              { type: "Maintenance" as const, id: "LIST" },
            ]
          : [{ type: "Maintenance", id: "LIST" }],
    }),
    createMaintenance: b.mutation<MaintenanceItem, MaintenanceCreate>({
      query: (body) => ({ url: "/maintenance", method: "POST", body }),
      invalidatesTags: [{ type: "Maintenance", id: "LIST" }],
    }),
    updateMaintenance: b.mutation<MaintenanceItem, { id: number; body: MaintenanceUpdate }>({
      query: ({ id, body }) => ({ url: `/maintenance/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, a) => [{ type: "Maintenance", id: a.id }],
    }),
    deleteMaintenance: b.mutation<void, number>({
      query: (id) => ({ url: `/maintenance/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Maintenance", id: "LIST" }],
    }),
  }),
});

export const {
  useListMaintenanceQuery,
  useCreateMaintenanceMutation,
  useUpdateMaintenanceMutation,
  useDeleteMaintenanceMutation,
} = maintenanceApi;
