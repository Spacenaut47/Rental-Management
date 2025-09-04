import { baseApi } from "../baseApi";
import type { Property, PropertyCreate } from "../../types/property";

export const propertiesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listProperties: build.query<Property[], void>({
      query: () => ({ url: "/properties" }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Property" as const, id: p.id })),
              { type: "Property" as const, id: "LIST" },
            ]
          : [{ type: "Property", id: "LIST" }],
    }),
    getProperty: build.query<Property, number>({
      query: (id) => ({ url: `/properties/${id}` }),
      providesTags: (_res, _err, id) => [{ type: "Property", id }],
    }),
    createProperty: build.mutation<Property, PropertyCreate>({
      query: (body) => ({ url: "/properties", method: "POST", body }),
      invalidatesTags: [{ type: "Property", id: "LIST" }],
    }),
    updateProperty: build.mutation<Property, { id: number; body: PropertyCreate }>({
      query: ({ id, body }) => ({ url: `/properties/${id}`, method: "PUT", body }),
      invalidatesTags: (_res, _err, args) => [{ type: "Property", id: args.id }],
    }),
    deleteProperty: build.mutation<void, number>({
      query: (id) => ({ url: `/properties/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Property", id: "LIST" }],
    }),
  }),
});

export const {
  useListPropertiesQuery,
  useGetPropertyQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
} = propertiesApi;
