export type RoomStatus = 'AVAILABLE' | 'OCCUPIED';
export type InvoiceStatus = 'UNPAID' | 'PAID' | 'CANCELLED';

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  createdAt: string;
  rooms?: Room[];
  _count?: {
    rooms: number;
  };
}

export interface Room {
  id: string;
  propertyId: string;
  property?: Property;
  roomNumber: string;
  monthlyPrice: number | string;
  status: RoomStatus;
  createdAt: string;
  contracts?: Contract[];
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  contracts?: Contract[];
  _count?: {
    contracts: number;
  };
}

export interface Contract {
  id: string;
  roomId: string;
  room?: Room;
  tenantId: string;
  tenant?: Tenant;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  invoices?: Invoice[];
}

export interface Invoice {
  id: string;
  contractId: string;
  contract?: Contract;
  invoiceNumber: string;
  amount: number | string;
  dueDate: string;
  status: InvoiceStatus;
  midtransOrderId?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
