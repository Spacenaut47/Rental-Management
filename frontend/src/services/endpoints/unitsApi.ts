import { baseApi } from "../baseApi";

export interface Unit {
  id: number;
  propertyId: number;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  sizeSqFt: number;
  isOccupied: boolean;
}
export type UnitCreate = Omit<Unit, "id">;

export const unitsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listUnits: b.query<Unit[], { propertyId?: number } | void>({
      query: (args) => {
        const qs =
          args && "propertyId" in args && args.propertyId
            ? `?propertyId=${args.propertyId}`
            : "";
        return { url: `/units${qs}` };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((u) => ({ type: "Unit" as const, id: u.id })),
              { type: "Unit" as const, id: "LIST" },
            ]
          : [{ type: "Unit", id: "LIST" }],
    }),
    createUnit: b.mutation<Unit, UnitCreate>({
      query: (body) => ({ url: "/units", method: "POST", body }),
      invalidatesTags: [{ type: "Unit", id: "LIST" }],
    }),
    updateUnit: b.mutation<Unit, { id: number; body: UnitCreate }>({
      query: ({ id, body }) => ({ url: `/units/${id}`, method: "PUT", body }),
      invalidatesTags: (_res, _err, arg) => [{ type: "Unit", id: arg.id }],
    }),
    deleteUnit: b.mutation<void, number>({
      query: (id) => ({ url: `/units/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Unit", id: "LIST" }],
    }),
  }),
});

export const {
  useListUnitsQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useDeleteUnitMutation,
} = unitsApi;
