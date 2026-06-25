export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  expiryDate?: Date;
  reorderLevel: number;
  cost: number;
  supplier?: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: 'in' | 'out';
  quantity: number;
  reason?: string;
  createdAt: Date;
}
