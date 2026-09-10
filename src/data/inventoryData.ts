// ============================================================
// Inventory Management — Suppliers & Stock Movement mock data
// ============================================================

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  phone: string;
  category: string;
  leadTime: string;
  rating: number;
  status: 'Active' | 'Inactive';
}

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  type: 'Received' | 'Sold' | 'Adjusted' | 'Returned' | 'Damaged' | 'Transferred';
  qty: number;
  reason: string;
  date: string;
  time: string;
  by: string;
  reference: string;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  items: { productId: number; productName: string; qty: number; unitCost: number }[];
  total: number;
  status: 'Draft' | 'Sent' | 'Confirmed' | 'Received' | 'Cancelled';
  orderedDate: string;
  expectedDate: string;
}

// Generic supplier pool — reused across business templates with category framing
export const supplierPool: Supplier[] = [
  { id: 1, name: 'Beirut Wholesale Supplies', contact: 'Hassan Fares', phone: '+961 1 555 201', category: 'General Supplies', leadTime: '2-3 days', rating: 4.7, status: 'Active' },
  { id: 2, name: 'Cedar Distribution Co.', contact: 'Maya Sleiman', phone: '+961 1 555 202', category: 'Beverages', leadTime: '1-2 days', rating: 4.9, status: 'Active' },
  { id: 3, name: 'Mountain Trading LLC', contact: 'Karim Daou', phone: '+961 3 555 203', category: 'Spare Parts', leadTime: '5-7 days', rating: 4.3, status: 'Active' },
  { id: 4, name: 'Phoenix Imports', contact: 'Sara Yazbek', phone: '+961 76 555 204', category: 'Electronics', leadTime: '7-10 days', rating: 4.5, status: 'Active' },
  { id: 5, name: 'Local Market Direct', contact: 'Tony Aoun', phone: '+961 70 555 205', category: 'Consumables', leadTime: 'Same day', rating: 4.8, status: 'Active' },
  { id: 6, name: 'Gulf Supply Partners', contact: 'Lina Khalil', phone: '+961 81 555 206', category: 'Bulk Goods', leadTime: '10-14 days', rating: 4.1, status: 'Inactive' },
];

const reasons = {
  Received: ['Purchase order delivery', 'Supplier restock', 'Bulk order arrival'],
  Sold: ['Customer purchase', 'Point-of-sale transaction', 'Bundled with service'],
  Adjusted: ['Stock count correction', 'Inventory audit', 'System recount'],
  Returned: ['Customer return', 'Defective item returned', 'Wrong item sent back'],
  Damaged: ['Damaged in storage', 'Expired / spoiled', 'Broken during handling'],
  Transferred: ['Moved to another branch', 'Internal transfer', 'Staff use'],
};

const staffNames = ['Tony', 'Sarah', 'Elie', 'Rami', 'Maya', 'Hassan', 'Layla'];

// Generates a realistic movement ledger for a given product list
export function generateMovements(products: { id: number; name: string }[]): StockMovement[] {
  const movements: StockMovement[] = [];
  let id = 1;
  const types: StockMovement['type'][] = ['Received', 'Sold', 'Sold', 'Sold', 'Adjusted', 'Returned', 'Damaged', 'Transferred'];
  const dates = ['2024-06-11', '2024-06-10', '2024-06-09', '2024-06-08', '2024-06-07', '2024-06-05'];

  products.forEach((p, pi) => {
    const movementCount = 2 + (pi % 3);
    for (let i = 0; i < movementCount; i++) {
      const type = types[(pi + i) % types.length];
      const isOutflow = type === 'Sold' || type === 'Damaged' || type === 'Transferred';
      const qty = type === 'Received' ? 10 + (i * 5) % 30 : 1 + (i % 5);
      const reasonList = reasons[type];
      movements.push({
        id: id++,
        productId: p.id,
        productName: p.name,
        type,
        qty: isOutflow ? -qty : qty,
        reason: reasonList[i % reasonList.length],
        date: dates[(pi + i) % dates.length],
        time: `${String(8 + (i * 2) % 10).padStart(2, '0')}:${String((i * 17) % 60).padStart(2, '0')}`,
        by: staffNames[(pi + i) % staffNames.length],
        reference: type === 'Received' ? `PO-${1000 + pi}` : type === 'Sold' ? `INV-${2000 + pi * 3 + i}` : `ADJ-${3000 + pi}`,
      });
    }
  });

  return movements.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Generates purchase orders referencing real products
export function generatePurchaseOrders(products: { id: number; name: string; cost: number; lowStockAt: number; stock: number }[], suppliers: Supplier[]): PurchaseOrder[] {
  const lowStockProducts = products.filter(p => p.stock <= p.lowStockAt);
  const orders: PurchaseOrder[] = [];

  if (lowStockProducts.length > 0) {
    const items = lowStockProducts.slice(0, 3).map(p => ({ productId: p.id, productName: p.name, qty: Math.max(20, p.lowStockAt * 3), unitCost: p.cost }));
    orders.push({
      id: 'PO-2024-014',
      supplier: suppliers[0].name,
      items,
      total: items.reduce((a, i) => a + i.qty * i.unitCost, 0),
      status: 'Draft',
      orderedDate: '—',
      expectedDate: '—',
    });
  }

  const midProducts = products.slice(0, 2);
  orders.push({
    id: 'PO-2024-013',
    supplier: suppliers[1]?.name || suppliers[0].name,
    items: midProducts.map(p => ({ productId: p.id, productName: p.name, qty: 30, unitCost: p.cost })),
    total: midProducts.reduce((a, p) => a + 30 * p.cost, 0),
    status: 'Sent',
    orderedDate: '2024-06-09',
    expectedDate: '2024-06-13',
  });

  orders.push({
    id: 'PO-2024-012',
    supplier: suppliers[2]?.name || suppliers[0].name,
    items: products.slice(1, 3).map(p => ({ productId: p.id, productName: p.name, qty: 25, unitCost: p.cost })),
    total: products.slice(1, 3).reduce((a, p) => a + 25 * p.cost, 0),
    status: 'Confirmed',
    orderedDate: '2024-06-06',
    expectedDate: '2024-06-12',
  });

  orders.push({
    id: 'PO-2024-011',
    supplier: suppliers[0].name,
    items: products.slice(0, 4).map(p => ({ productId: p.id, productName: p.name, qty: 15, unitCost: p.cost })),
    total: products.slice(0, 4).reduce((a, p) => a + 15 * p.cost, 0),
    status: 'Received',
    orderedDate: '2024-05-28',
    expectedDate: '2024-06-02',
  });

  return orders;
}
