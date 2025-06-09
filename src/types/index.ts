// Shared type definitions for the application

export interface Locker {
  _id: string;
  code: string;
  label: string;
  description?: string;
  qrCode: string;
  createdAt: string;
}

export interface Item {
  _id: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  lockerId: string | { _id: string; code: string; label: string };
  createdAt: string;
}
