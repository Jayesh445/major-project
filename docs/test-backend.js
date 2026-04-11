/**
 * AutoStock AI — Backend API Test Suite
 * Tests all REST endpoints end-to-end with real MongoDB data.
 */

const BASE = 'http://localhost:5000';
const AUTH = { email: 'admin@autostock.ai', password: 'Admin@123' };

let token = '';
let testIds = {};
const results = [];

function log(step, status, detail = '', ms = 0) {
  const icon = status === 'PASS' ? '[OK]' : status === 'FAIL' ? '[X]' : '[--]';
  console.log(`${icon} ${step.padEnd(50)} ${status.padEnd(6)} ${ms}ms ${detail}`);
  results.push({ step, status, detail, ms });
}

async function req(method, path, body = null, opts = {}) {
  const start = Date.now();
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  if (token && !opts.noAuth) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const ms = Date.now() - start;
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { ok: res.ok, status: res.status, data, ms };
  } catch (err) {
    return { ok: false, status: 0, data: err.message, ms: Date.now() - start };
  }
}

async function test(name, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    const ms = Date.now() - start;
    if (result === false) {
      log(name, 'FAIL', '', ms);
    } else if (result && result.fail) {
      log(name, 'FAIL', result.fail, ms);
    } else {
      log(name, 'PASS', result?.detail || '', ms);
    }
  } catch (err) {
    log(name, 'FAIL', err.message, Date.now() - start);
  }
}

async function runTests() {
  console.log('\n==================================================');
  console.log('  AutoStock AI — Backend API Test Suite');
  console.log('==================================================\n');

  // ── Health ──────────────────────────────────────────────────────────
  console.log('\n--- 1. HEALTH & INFRASTRUCTURE ---');
  await test('GET /health', async () => {
    const r = await req('GET', '/health', null, { noAuth: true });
    return r.ok && r.data.status === 'ok' ? { detail: r.data.timestamp } : { fail: `${r.status}` };
  });

  // ── Auth ────────────────────────────────────────────────────────────
  console.log('\n--- 2. AUTHENTICATION ---');
  await test('POST /users/login', async () => {
    const r = await req('POST', '/api/v1/users/login', AUTH, { noAuth: true });
    if (r.ok && r.data.data?.accessToken) {
      token = r.data.data.accessToken;
      return { detail: `token=${token.slice(0, 16)}...` };
    }
    return { fail: `${r.status} ${JSON.stringify(r.data)}` };
  });

  await test('GET /users/profile (authenticated)', async () => {
    const r = await req('GET', '/api/v1/users/profile');
    return r.ok ? { detail: r.data.data?.email } : { fail: `${r.status}` };
  });

  await test('GET /users (list)', async () => {
    const r = await req('GET', '/api/v1/users');
    return r.ok ? { detail: `${r.data.data?.data?.length ?? 0} users` } : { fail: `${r.status}` };
  });

  // ── Products ────────────────────────────────────────────────────────
  console.log('\n--- 3. PRODUCTS ---');
  await test('POST /products (create)', async () => {
    const body = {
      sku: `TEST${Date.now().toString(36).toUpperCase()}`,
      name: 'Test Pen',
      description: 'Test product for API test',
      category: 'writing_instruments',
      unit: 'piece',
      unitPrice: 15,
      reorderPoint: 50,
      reorderQty: 100,
      safetyStock: 20,
      leadTimeDays: 7,
    };
    const r = await req('POST', '/api/v1/products', body);
    if (r.ok && r.data.data?._id) {
      testIds.productId = r.data.data._id;
      return { detail: `id=${testIds.productId}` };
    }
    return { fail: `${r.status} ${JSON.stringify(r.data)}` };
  });

  await test('GET /products (list)', async () => {
    const r = await req('GET', '/api/v1/products');
    return r.ok ? { detail: `${r.data.data?.data?.length ?? 0} products` } : { fail: `${r.status}` };
  });

  await test('GET /products/:id (get by id)', async () => {
    if (!testIds.productId) return { fail: 'no productId' };
    const r = await req('GET', `/api/v1/products/${testIds.productId}`);
    return r.ok ? { detail: r.data.data?.name } : { fail: `${r.status}` };
  });

  // ── Warehouses ──────────────────────────────────────────────────────
  console.log('\n--- 4. WAREHOUSES ---');
  await test('POST /warehouses (create)', async () => {
    const code = `T${Date.now().toString(36).toUpperCase().slice(-8)}`;
    const body = {
      name: 'Test Warehouse',
      code,
      location: {
        address: '123 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: '400001',
      },
      totalCapacity: 10000,
      usedCapacity: 2000,
      isActive: true,
    };
    const r = await req('POST', '/api/v1/warehouses', body);
    if (r.ok && r.data.data?._id) {
      testIds.warehouseId = r.data.data._id;
      return { detail: `id=${testIds.warehouseId}` };
    }
    return { fail: `${r.status} ${JSON.stringify(r.data)}` };
  });

  await test('GET /warehouses (list)', async () => {
    const r = await req('GET', '/api/v1/warehouses');
    return r.ok ? { detail: `${r.data.data?.data?.length ?? 0} warehouses` } : { fail: `${r.status}` };
  });

  // ── Suppliers ───────────────────────────────────────────────────────
  console.log('\n--- 5. SUPPLIERS ---');
  await test('POST /suppliers (create)', async () => {
    const body = {
      companyName: `Test Supplier ${Date.now()}`,
      contactEmail: `test${Date.now()}@supplier.com`,
      contactPhone: '+91-9876543210',
      address: 'Test Business Park, Sector 1, Mumbai, 400001',
      rating: 4.5,
      isApproved: true,
      catalogProducts: testIds.productId ? [{
        product: testIds.productId,
        unitPrice: 100,
        leadTimeDays: 5,
        moq: 10,
      }] : [],
    };
    const r = await req('POST', '/api/v1/suppliers', body);
    if (r.ok && r.data.data?._id) {
      testIds.supplierId = r.data.data._id;
      return { detail: `id=${testIds.supplierId}` };
    }
    return { fail: `${r.status} ${JSON.stringify(r.data)}` };
  });

  await test('GET /suppliers (list)', async () => {
    const r = await req('GET', '/api/v1/suppliers');
    return r.ok ? { detail: `${r.data.data?.data?.length ?? 0} suppliers` } : { fail: `${r.status}` };
  });

  await test('GET /suppliers/:id', async () => {
    if (!testIds.supplierId) return { fail: 'no supplierId' };
    const r = await req('GET', `/api/v1/suppliers/${testIds.supplierId}`);
    return r.ok ? { detail: r.data.data?.companyName } : { fail: `${r.status}` };
  });

  await test('PUT /suppliers/:id (update)', async () => {
    if (!testIds.supplierId) return { fail: 'no supplierId' };
    const r = await req('PUT', `/api/v1/suppliers/${testIds.supplierId}`, { rating: 5 });
    return r.ok ? { detail: `rating=${r.data.data?.rating}` } : { fail: `${r.status}` };
  });

  // ── Inventory ───────────────────────────────────────────────────────
  console.log('\n--- 6. INVENTORY ---');
  await test('GET /inventory (list)', async () => {
    const r = await req('GET', '/api/v1/inventory');
    return r.ok ? { detail: `${r.data.data?.data?.length ?? 0} items` } : { fail: `${r.status}` };
  });

  // ── Purchase Orders ─────────────────────────────────────────────────
  console.log('\n--- 7. PURCHASE ORDERS ---');
  await test('GET /purchase-orders (list)', async () => {
    const r = await req('GET', '/api/v1/purchase-orders');
    return r.ok ? { detail: `${r.data.data?.data?.length ?? 0} POs` } : { fail: `${r.status}` };
  });

  // ── Dashboard Stats ─────────────────────────────────────────────────
  console.log('\n--- 8. DASHBOARD STATS ---');
  await test('GET /dashboard/admin-stats', async () => {
    const r = await req('GET', '/api/v1/dashboard/admin-stats');
    if (r.ok) {
      const d = r.data.data;
      return { detail: `users=${d?.totalUsers}, products=${d?.totalProducts}, warehouses=${d?.totalWarehouses}, recentActivity=${d?.recentActivity?.length ?? 0}` };
    }
    return { fail: `${r.status}` };
  });

  await test('GET /dashboard/warehouse-stats', async () => {
    const r = await req('GET', '/api/v1/dashboard/warehouse-stats');
    if (r.ok) {
      const d = r.data.data;
      return { detail: `inv=${d?.totalInventory}, low=${d?.lowStockAlerts}, pending=${d?.pendingReceiving}, transfers=${d?.activeTransfers}` };
    }
    return { fail: `${r.status}` };
  });

  await test('GET /dashboard/procurement-stats', async () => {
    const r = await req('GET', '/api/v1/dashboard/procurement-stats');
    if (r.ok) {
      const d = r.data.data;
      return { detail: `spend=${d?.totalSpendMTD}, pending=${d?.pendingApprovals}, open=${d?.openOrders}` };
    }
    return { fail: `${r.status}` };
  });

  await test('GET /dashboard/agent-stats', async () => {
    const r = await req('GET', '/api/v1/dashboard/agent-stats');
    if (r.ok) {
      const d = r.data.data;
      return { detail: `forecasts=${d?.totalForecasts}, optimizations=${d?.totalOptimizations}` };
    }
    return { fail: `${r.status}` };
  });

  // ── Agent Routes ────────────────────────────────────────────────────
  console.log('\n--- 9. AGENT API ROUTES ---');
  await test('GET /api/agents/status', async () => {
    const r = await req('GET', '/api/agents/status');
    if (r.ok) {
      const d = r.data.data;
      return { detail: `${d?.agents?.length ?? 0} agents, ${d?.recentNegotiations?.length ?? 0} recent negotiations` };
    }
    return { fail: `${r.status}` };
  });

  await test('GET /api/agents/negotiation/sessions', async () => {
    const r = await req('GET', '/api/agents/negotiation/sessions');
    return r.ok ? { detail: `${r.data.data?.length ?? 0} sessions` } : { fail: `${r.status}` };
  });

  await test('GET /api/agents/blockchain/logs', async () => {
    const r = await req('GET', '/api/agents/blockchain/logs');
    return r.ok ? { detail: `${r.data.data?.length ?? 0} logs` } : { fail: `${r.status}` };
  });

  // ── Internal Routes (requires INTERNAL_API_KEY) ─────────────────────
  console.log('\n--- 10. INTERNAL ROUTES (Mastra API) ---');
  const INTERNAL_KEY = process.env.INTERNAL_API_KEY || 'internal-sc-ai-secret-key-2024';

  await test('GET /api/internal/warehouses (with internal key)', async () => {
    const r = await req('GET', '/api/internal/warehouses', null, {
      noAuth: true,
      headers: { 'x-internal-api-key': INTERNAL_KEY },
    });
    return r.ok ? { detail: `${Array.isArray(r.data) ? r.data.length : 0} warehouses` } : { fail: `${r.status} ${JSON.stringify(r.data).slice(0, 100)}` };
  });

  await test('GET /api/internal/suppliers', async () => {
    const r = await req('GET', '/api/internal/suppliers', null, {
      noAuth: true,
      headers: { 'x-internal-api-key': INTERNAL_KEY },
    });
    return r.ok ? { detail: `${Array.isArray(r.data) ? r.data.length : 0} suppliers` } : { fail: `${r.status}` };
  });

  await test('GET /api/internal/inventory/all', async () => {
    const r = await req('GET', '/api/internal/inventory/all', null, {
      noAuth: true,
      headers: { 'x-internal-api-key': INTERNAL_KEY },
    });
    return r.ok ? { detail: `${Array.isArray(r.data) ? r.data.length : 0} items` } : { fail: `${r.status}` };
  });

  // ── Cleanup ─────────────────────────────────────────────────────────
  console.log('\n--- 11. CLEANUP ---');
  if (testIds.supplierId) {
    await test('DELETE /suppliers/:id', async () => {
      const r = await req('DELETE', `/api/v1/suppliers/${testIds.supplierId}`);
      return r.ok ? { detail: 'deleted' } : { fail: `${r.status}` };
    });
  }
  if (testIds.productId) {
    await test('DELETE /products/:id', async () => {
      const r = await req('DELETE', `/api/v1/products/${testIds.productId}`);
      return r.ok ? { detail: 'deleted' } : { fail: `${r.status}` };
    });
  }
  if (testIds.warehouseId) {
    await test('DELETE /warehouses/:id', async () => {
      const r = await req('DELETE', `/api/v1/warehouses/${testIds.warehouseId}`);
      return r.ok ? { detail: 'deleted' } : { fail: `${r.status}` };
    });
  }

  // ── Report ──────────────────────────────────────────────────────────
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const avgMs = Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length);
  const maxMs = Math.max(...results.map(r => r.ms));

  console.log('\n==================================================');
  console.log('  TEST RESULTS SUMMARY');
  console.log('==================================================');
  console.log(`Total tests:   ${results.length}`);
  console.log(`Passed:        ${pass}`);
  console.log(`Failed:        ${fail}`);
  console.log(`Success rate:  ${((pass / results.length) * 100).toFixed(1)}%`);
  console.log(`Avg latency:   ${avgMs}ms`);
  console.log(`Max latency:   ${maxMs}ms`);
  console.log('==================================================\n');

  // Save JSON report
  const fs = require('fs');
  fs.writeFileSync(
    require('path').join(__dirname, 'backend-test-report.json'),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { total: results.length, pass, fail, successRate: (pass / results.length) * 100, avgMs, maxMs },
      results,
    }, null, 2)
  );
  console.log('Report saved to: docs/backend-test-report.json');
}

runTests().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
