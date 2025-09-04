export interface Property {
  id: number;
  name: string;
  description?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface PropertyCreate {
  name: string;
  description?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}
