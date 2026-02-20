/**
 * Backend API client for the Mastra AI module.
 * All data access goes through the backend's /api/internal/* endpoints
 * using a shared INTERNAL_API_KEY — no direct MongoDB connection needed.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

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
