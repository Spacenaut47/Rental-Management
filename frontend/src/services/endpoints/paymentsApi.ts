import { baseApi } from "../baseApi";

export interface Payment {
  id: number;
  leaseId: number;
  paidOnUtc: string;
  amount: number;
  method: number; // enum
  reference?: string | null;
  notes?: string | null;
}
export interface PaymentCreate {
  leaseId: number;
  amount: number;
  method: number;
  reference?: string;
  notes?: string;
}

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listPaymentsForLease: b.query<Payment[], number>({
      query: (leaseId) => ({ url: `/payments/lease/${leaseId}` }),
      providesTags: (result, _err, leaseId) =>
        result
          ? [
              ...result.map((p) => ({ type: "Payment" as const, id: p.id })),
              { type: "Payment" as const, id: `LEASE-${leaseId}` },
            ]
          : [{ type: "Payment", id: `LEASE-${leaseId}` }],
    }),
    totalPaidForLease: b.query<number, number>({
      query: (leaseId) => ({ url: `/payments/lease/${leaseId}/total` }),
      providesTags: (_r, _e, leaseId) => [{ type: "Payment", id: `TOTAL-${leaseId}` }],
    }),
    createPayment: b.mutation<Payment, PaymentCreate>({
      query: (body) => ({ url: "/payments", method: "POST", body }),
      invalidatesTags: (_r, _e, body) => [
        { type: "Payment", id: `LEASE-${body.leaseId}` },
        { type: "Payment", id: `TOTAL-${body.leaseId}` },
      ],
    }),
  }),
});

export const {
  useListPaymentsForLeaseQuery,
  useTotalPaidForLeaseQuery,
  useCreatePaymentMutation,
} = paymentsApi;
