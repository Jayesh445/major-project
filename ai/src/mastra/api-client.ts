/**
 * Backend API client for the Mastra AI module.
 * All data access goes through the backend's /api/internal/* endpoints
 * using a shared INTERNAL_API_KEY — no direct MongoDB connection needed.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'new-key';

async function internalFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${BACKEND_URL}/api/internal${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-api-key': INTERNAL_API_KEY,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Backend ${options.method ?? 'GET'} ${path} → ${res.status}: ${body}`);
  }

  return res.json();
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function getProductById(
  id: string
): Promise<{ _id: string; name: string; sku: string; isActive: boolean }> {
  return internalFetch(`/products/${id}`);
}

// ── Warehouses ────────────────────────────────────────────────────────────────

export async function getWarehouseById(
  id: string
): Promise<{ _id: string; name: string; code: string; isActive: boolean }> {
  return internalFetch(`/warehouses/${id}`);
}

export async function getActiveWarehouses(): Promise<
  Array<{
    _id: string;
    name: string;
    code: string;
    totalCapacity: number;
    usedCapacity: number;
    isActive: boolean;
    location: { city: string; state: string };
  }>
> {
  return internalFetch('/warehouses');
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export async function getInventoryByProductWarehouse(
  productId: string,
  warehouseId: string
): Promise<any> {
  return internalFetch(`/inventory?product=${productId}&warehouse=${warehouseId}`);
}

export async function getAllInventory(): Promise<any[]> {
  return internalFetch('/inventory/all');
}

// ── Write endpoints ───────────────────────────────────────────────────────────

export async function saveForecast(payload: object): Promise<{ _id: string }> {
  return internalFetch('/forecasts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function saveWarehouseOptimization(payload: object): Promise<{ _id: string }> {
  return internalFetch('/warehouse-optimization', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── Suppliers ────────────────────────────────────────────────────────────────

export async function getApprovedSuppliers(): Promise<any[]> {
  return internalFetch('/suppliers');
}

export async function getSupplierById(id: string): Promise<any> {
  return internalFetch(`/suppliers/${id}`);
}

export async function getSuppliersByProduct(productId: string): Promise<any[]> {
  return internalFetch(`/suppliers/by-product/${productId}`);
}

export async function updateSupplierStats(id: string, stats: object): Promise<any> {
  return internalFetch(`/suppliers/${id}/stats`, {
    method: 'PATCH',
    body: JSON.stringify(stats),
  });
}

// ── Negotiations ─────────────────────────────────────────────────────────────

export async function createNegotiation(payload: object): Promise<{ _id: string }> {
  return internalFetch('/negotiations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getNegotiationById(id: string): Promise<any> {
  return internalFetch(`/negotiations/${id}`);
}

export async function updateNegotiation(id: string, payload: object): Promise<any> {
  return internalFetch(`/negotiations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function addNegotiationRound(id: string, round: object): Promise<any> {
  return internalFetch(`/negotiations/${id}/rounds`, {
    method: 'POST',
    body: JSON.stringify(round),
  });
}

// ── Purchase Orders ──────────────────────────────────────────────────────────

export async function createPurchaseOrder(payload: object): Promise<{ _id: string; poNumber: string }> {
  return internalFetch('/purchase-orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPurchaseOrderById(id: string): Promise<any> {
  return internalFetch(`/purchase-orders/${id}`);
}

export async function updatePurchaseOrder(id: string, payload: object): Promise<any> {
  return internalFetch(`/purchase-orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getPurchaseOrders(filters?: {
  supplier?: string;
  warehouse?: string;
  status?: string;
  limit?: number;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.supplier) params.set('supplier', filters.supplier);
  if (filters?.warehouse) params.set('warehouse', filters.warehouse);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.limit) params.set('limit', String(filters.limit));
  return internalFetch(`/purchase-orders?${params.toString()}`);
}

// ── Blockchain Logs ──────────────────────────────────────────────────────────

export interface BlockchainLogPayload {
  eventType: string;
  referenceModel: 'PurchaseOrder' | 'NegotiationSession' | 'Inventory';
  referenceId: string;
  payload: Record<string, unknown>;
  amount?: number;
  triggeredBy?: string;
}

export interface BlockchainLogResult {
  _id: string;
  txHash: string;
  confirmationStatus: 'pending' | 'confirmed' | 'failed';
  etherscanUrl: string;
}

export async function createBlockchainLog(
  payload: BlockchainLogPayload
): Promise<BlockchainLogResult> {
  return internalFetch('/blockchain-logs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getBlockchainLogs(filters?: {
  referenceId?: string;
  referenceModel?: string;
  eventType?: string;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.referenceId) params.set('referenceId', filters.referenceId);
  if (filters?.referenceModel) params.set('referenceModel', filters.referenceModel);
  if (filters?.eventType) params.set('eventType', filters.eventType);
  return internalFetch(`/blockchain-logs?${params.toString()}`);
}

// ── Forecasts (read) ─────────────────────────────────────────────────────────

export async function getForecasts(filters?: {
  product?: string;
  warehouse?: string;
  limit?: number;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.product) params.set('product', filters.product);
  if (filters?.warehouse) params.set('warehouse', filters.warehouse);
  if (filters?.limit) params.set('limit', String(filters.limit));
  return internalFetch(`/forecasts?${params.toString()}`);
}
