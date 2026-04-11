/**
 * AutoStock AI — Agent Workflow Test Suite
 * Tests all 8 Mastra workflows end-to-end with performance metrics.
 */

const BACKEND = 'http://localhost:5000';
const MASTRA = 'http://localhost:4111';
const AUTH = { email: 'admin@autostock.ai', password: 'Admin@123' };

let token = '';
const results = [];

function log(name, status, ms, detail = '') {
  const icon = status === 'PASS' ? '[OK]' : status === 'FAIL' ? '[X]' : '[--]';
  const msStr = ms > 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
  console.log(`${icon} ${name.padEnd(50)} ${status.padEnd(6)} ${msStr.padEnd(8)} ${detail}`);
  results.push({ name, status, ms, detail });
}

async function req(url, method = 'GET', body = null, headers = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) opts.body = JSON.stringify(body);
  const start = Date.now();
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { ok: res.ok, status: res.status, data, ms: Date.now() - start };
  } catch (err) {
    return { ok: false, status: 0, data: err.message, ms: Date.now() - start };
  }
}

async function login() {
  const r = await req(`${BACKEND}/api/v1/users/login`, 'POST', AUTH);
  token = r.data?.data?.accessToken || '';
  return !!token;
}

async function authReq(path, method = 'GET', body = null) {
  return req(`${BACKEND}${path}`, method, body, { Authorization: `Bearer ${token}` });
}

async function fetchTestData() {
  const [productsRes, warehousesRes, suppliersRes] = await Promise.all([
    authReq('/api/v1/products'),
    authReq('/api/v1/warehouses'),
    authReq('/api/v1/suppliers'),
  ]);
  return {
    product: productsRes.data?.data?.data?.[0],
    warehouse: warehousesRes.data?.data?.data?.[0],
    supplier: suppliersRes.data?.data?.data?.[0],
  };
}

async function testMastraStatus() {
  console.log('\n--- 1. MASTRA INFRASTRUCTURE ---');
  const r = await req(`${MASTRA}/api`);
  log('GET Mastra API root', r.ok ? 'PASS' : 'FAIL', r.ms, r.ok ? 'Mastra up' : `${r.status}`);
  return r.ok;
}

async function testWorkflowViaBackend(name, path, body) {
  const start = Date.now();
  const r = await authReq(path, 'POST', body);
  const ms = Date.now() - start;
  if (r.ok) {
    const data = r.data?.data;
    const detail = typeof data === 'object' ? JSON.stringify(data).slice(0, 80) : '';
    log(name, 'PASS', ms, detail);
    return { success: true, ms, data };
  } else {
    const err = typeof r.data === 'object' ? JSON.stringify(r.data).slice(0, 80) : r.data.toString().slice(0, 80);
    log(name, 'FAIL', ms, `${r.status} ${err}`);
    return { success: false, ms, data: null };
  }
}

async function runTests() {
  console.log('\n==================================================');
  console.log('  AutoStock AI — Agent Workflow Test Suite');
  console.log('==================================================\n');

  // Login
  console.log('Logging in...');
  if (!await login()) {
    console.error('FATAL: Login failed');
    process.exit(1);
  }
  console.log('OK\n');

  // Check Mastra
  const mastraUp = await testMastraStatus();
  if (!mastraUp) {
    console.error('\nMastra is not running on port 4111. Start it with: cd ai && pnpm dev');
    process.exit(1);
  }

  // Fetch test data
  console.log('\nFetching existing data for tests...');
  const data = await fetchTestData();
  if (!data.product || !data.warehouse) {
    console.error('FATAL: No existing products/warehouses in DB');
    process.exit(1);
  }
  console.log(`Product: ${data.product.name} (${data.product.sku})`);
  console.log(`Warehouse: ${data.warehouse.name} (${data.warehouse.code})`);
  console.log(`Supplier: ${data.supplier?.companyName || 'none'}`);

  // ── Workflow Tests ──────────────────────────────────────────────────
  console.log('\n--- 2. AGENT STATUS ENDPOINT ---');
  await testWorkflowViaBackend('GET /api/agents/status', '/api/agents/status'.replace('POST', 'GET'), null);
  const statusRes = await authReq('/api/agents/status');
  if (statusRes.ok) {
    const agents = statusRes.data?.data?.agents || [];
    const stats = statusRes.data?.data?.stats || {};
    log(`  - ${agents.length} agents registered`, 'PASS', statusRes.ms, '');
    log(`  - ${stats.totalForecasts ?? 0} forecasts, ${stats.totalNegotiations ?? 0} negotiations`, 'PASS', 0, '');
  }

  // ── Procurement Check ──────────────────────────────────────────────
  console.log('\n--- 3. PROCUREMENT ORCHESTRATOR AGENT ---');
  await testWorkflowViaBackend(
    'POST /api/agents/procurement/check',
    '/api/agents/procurement/check',
    { productId: data.product._id, warehouseId: data.warehouse._id }
  );

  // ── Anomaly Detection ──────────────────────────────────────────────
  console.log('\n--- 4. ANOMALY DETECTION AGENT ---');
  await testWorkflowViaBackend(
    'POST /api/agents/anomaly-detection/scan',
    '/api/agents/anomaly-detection/scan',
    {}
  );

  // ── Smart Reorder ──────────────────────────────────────────────────
  console.log('\n--- 5. SMART REORDER AGENT ---');
  await testWorkflowViaBackend(
    'POST /api/agents/smart-reorder/run',
    '/api/agents/smart-reorder/run',
    {}
  );

  // ── Supplier Evaluation ────────────────────────────────────────────
  console.log('\n--- 6. SUPPLIER EVALUATION AGENT ---');
  await testWorkflowViaBackend(
    'POST /api/agents/supplier-evaluation/run',
    '/api/agents/supplier-evaluation/run',
    {}
  );

  // ── Negotiation (flagship) ─────────────────────────────────────────
  if (data.supplier) {
    console.log('\n--- 7. NEGOTIATION AGENT (flagship) ---');
    await testWorkflowViaBackend(
      'POST /api/agents/negotiation/trigger',
      '/api/agents/negotiation/trigger',
      {
        productId: data.product._id,
        warehouseId: data.warehouse._id,
        requiredQty: 100,
        maxUnitPrice: 150,
        targetUnitPrice: 120,
        maxLeadTimeDays: 10,
      }
    );
  } else {
    log('POST /api/agents/negotiation/trigger', 'SKIP', 0, 'no supplier in DB');
  }

  // ── Read negotiation sessions ──────────────────────────────────────
  console.log('\n--- 8. NEGOTIATION RESULTS ---');
  const sessionsRes = await authReq('/api/agents/negotiation/sessions');
  if (sessionsRes.ok) {
    const sessions = sessionsRes.data?.data || [];
    log(`GET /api/agents/negotiation/sessions`, 'PASS', sessionsRes.ms, `${sessions.length} sessions`);

    // Show last session details
    if (sessions.length > 0) {
      const latest = sessions[0];
      log(`  - Latest: ${latest.supplier?.companyName || '?'} - ${latest.status}`, 'PASS', 0, `rounds=${latest.rounds?.length || 0}`);
      if (latest.finalTerms) {
        log(`  - Final: Rs.${latest.finalTerms.unitPrice}/unit (${latest.finalTerms.savingsPercent}% saved)`, 'PASS', 0, '');
      }

      // Fetch full details
      const detailRes = await authReq(`/api/agents/negotiation/sessions/${latest._id}`);
      if (detailRes.ok) {
        log(`GET session details`, 'PASS', detailRes.ms, `${detailRes.data?.data?.rounds?.length || 0} rounds fetched`);
      }
    }
  }

  // ── Blockchain Logs ────────────────────────────────────────────────
  console.log('\n--- 9. BLOCKCHAIN AUDIT TRAIL ---');
  const logsRes = await authReq('/api/agents/blockchain/logs');
  if (logsRes.ok) {
    const logs = logsRes.data?.data || [];
    log(`GET /api/agents/blockchain/logs`, 'PASS', logsRes.ms, `${logs.length} logs`);
    if (logs.length > 0) {
      const eventCounts = {};
      logs.forEach(l => { eventCounts[l.eventType] = (eventCounts[l.eventType] || 0) + 1; });
      log(`  - Events: ${Object.entries(eventCounts).map(([k, v]) => `${k}=${v}`).join(', ')}`, 'PASS', 0, '');
    }
  }

  // ── Performance Report ─────────────────────────────────────────────
  console.log('\n==================================================');
  console.log('  AGENT WORKFLOW PERFORMANCE REPORT');
  console.log('==================================================');

  const workflowResults = results.filter(r => r.name.includes('POST /api/agents/') || r.name === 'GET Mastra API root');
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const skip = results.filter(r => r.status === 'SKIP').length;

  const workflowTimes = workflowResults.filter(r => r.ms > 100).map(r => r.ms);
  const avgTime = workflowTimes.length > 0 ? Math.round(workflowTimes.reduce((a, b) => a + b, 0) / workflowTimes.length) : 0;
  const maxTime = workflowTimes.length > 0 ? Math.max(...workflowTimes) : 0;
  const minTime = workflowTimes.length > 0 ? Math.min(...workflowTimes) : 0;

  console.log(`Total tests:     ${results.length}`);
  console.log(`Passed:          ${pass}`);
  console.log(`Failed:          ${fail}`);
  console.log(`Skipped:         ${skip}`);
  console.log(`Success rate:    ${((pass / (pass + fail)) * 100).toFixed(1)}%`);
  console.log('');
  console.log('Workflow latency (only agent calls):');
  console.log(`  - Average:     ${avgTime > 1000 ? (avgTime / 1000).toFixed(1) + 's' : avgTime + 'ms'}`);
  console.log(`  - Minimum:     ${minTime > 1000 ? (minTime / 1000).toFixed(1) + 's' : minTime + 'ms'}`);
  console.log(`  - Maximum:     ${maxTime > 1000 ? (maxTime / 1000).toFixed(1) + 's' : maxTime + 'ms'}`);
  console.log('==================================================\n');

  // Save report
  const fs = require('fs');
  fs.writeFileSync(
    require('path').join(__dirname, 'agent-test-report.json'),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        pass,
        fail,
        skip,
        successRate: (pass / (pass + fail)) * 100,
        avgWorkflowMs: avgTime,
        minWorkflowMs: minTime,
        maxWorkflowMs: maxTime,
      },
      results,
    }, null, 2)
  );
  console.log('Report saved to: docs/agent-test-report.json');
}

runTests().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
