const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const SS_DIR = path.join(__dirname, 'screenshots');

const AUTH = {
  email: 'admin@autostock.ai',
  password: 'Admin@123',
};

const PAGES = [
  { name: '01-landing', path: '/', noAuth: true },
  { name: '02-login', path: '/login', noAuth: true },
  { name: '03-signup', path: '/signup', noAuth: true },
  { name: '04-forgot-password', path: '/forgot-password', noAuth: true },
  { name: '05-admin-dashboard', path: '/dashboard/admin' },
  { name: '06-products', path: '/dashboard/admin/products' },
  { name: '07-product-new', path: '/dashboard/admin/products/new' },
  { name: '08-suppliers', path: '/dashboard/admin/suppliers' },
  { name: '09-supplier-new', path: '/dashboard/admin/suppliers/new' },
  { name: '10-users', path: '/dashboard/admin/users' },
  { name: '11-warehouses', path: '/dashboard/admin/warehouses' },
  { name: '12-analytics', path: '/dashboard/admin/analytics' },
  { name: '13-procurement-dashboard', path: '/dashboard/procurement' },
  { name: '14-purchase-orders', path: '/dashboard/procurement/orders' },
  { name: '15-replenishment', path: '/dashboard/procurement/replenishment' },
  { name: '16-cost-analysis', path: '/dashboard/procurement/costs' },
  { name: '17-warehouse-dashboard', path: '/dashboard/warehouse' },
  { name: '18-inventory', path: '/dashboard/warehouse/inventory' },
  { name: '19-receiving', path: '/dashboard/warehouse/receiving' },
  { name: '20-transfers', path: '/dashboard/warehouse/transfers' },
  { name: '21-supplier-catalog', path: '/dashboard/supplier/catalog' },
  { name: '22-supplier-orders', path: '/dashboard/supplier/orders' },
  { name: '23-agent-hub', path: '/dashboard/dev-tools/agent-hub' },
  { name: '24-agent-monitor', path: '/dashboard/dev-tools/agent-monitor' },
  { name: '25-negotiations', path: '/dashboard/dev-tools/negotiations' },
];

// Pages to skip if file already exists
const SKIP_EXISTING = true;

async function getAuthData() {
  const res = await fetch(`http://localhost:5000/api/v1/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(AUTH),
  });
  const data = await res.json();
  return data.data;
}

async function launchBrowser() {
  return puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    protocolTimeout: 120000, // 2 minutes
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
}

async function setupAuthInPage(page, authData) {
  await page.evaluateOnNewDocument((token, refresh, user) => {
    const state = {
      state: {
        user: user,
        accessToken: token,
        refreshToken: refresh,
        isAuthenticated: true,
      },
      version: 0,
    };
    localStorage.setItem('auth-storage', JSON.stringify(state));
  }, authData.accessToken, authData.refreshToken, authData.user);
}

async function captureOne(page, pg) {
  const url = `${BASE}${pg.path}`;
  const file = path.join(SS_DIR, `${pg.name}.png`);

  if (SKIP_EXISTING && fs.existsSync(file)) {
    console.log(`SKIP: ${pg.name} (already exists)`);
    return;
  }

  try {
    console.log(`Capturing: ${pg.name} (${pg.path})`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: file, fullPage: true });
    console.log(`  -> Saved: ${file}`);
  } catch (err) {
    console.error(`  -> FAILED: ${pg.name} - ${err.message}`);
    try {
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: file, fullPage: true });
      console.log(`  -> Saved (fallback): ${file}`);
    } catch (e) {
      console.error(`  -> TOTAL FAILURE: ${pg.name} - ${e.message}`);
    }
  }
}

async function run() {
  if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

  console.log('Fetching auth data...');
  const authData = await getAuthData();
  console.log('Auth token:', authData.accessToken.slice(0, 20) + '...');

  // Process in batches of 5, restarting the browser each time
  const BATCH_SIZE = 5;
  for (let i = 0; i < PAGES.length; i += BATCH_SIZE) {
    const batch = PAGES.slice(i, i + BATCH_SIZE);
    console.log(`\n=== Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(PAGES.length / BATCH_SIZE)} ===`);

    const browser = await launchBrowser();
    const page = await browser.newPage();
    await setupAuthInPage(page, authData);

    for (const pg of batch) {
      await captureOne(page, pg);
      // Small pause between pages
      await new Promise(r => setTimeout(r, 2000));
    }

    await browser.close();
    // Let dev server recover between batches
    console.log('Cooling down 5s...');
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log(`\nDone! Screenshots saved to ${SS_DIR}`);
  const files = fs.readdirSync(SS_DIR).filter(f => f.endsWith('.png'));
  console.log(`Total: ${files.length}/${PAGES.length}`);
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
