"use strict";
/**
 * Seed script for Supply Chain Management system.
 * Generates realistic test data for Mastra AI agents:
 *   - Forecast Agent: needs 90 days of transaction history with demand patterns
 *   - Warehouse Optimization Agent: needs varied warehouse utilization & inventory imbalances
 *
 * Usage: npx tsx src/scripts/seed.ts
 * Add --clean flag to drop existing data first: npx tsx src/scripts/seed.ts --clean
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const model_1 = __importDefault(require("../modules/user/model"));
const model_2 = __importDefault(require("../modules/product/model"));
const model_3 = __importDefault(require("../modules/warehouse/model"));
const model_4 = __importDefault(require("../modules/supplier/model"));
const model_5 = __importDefault(require("../modules/inventory/model"));
const model_6 = __importDefault(require("../modules/purchase-order/model"));
// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://jayesh040405_db_user:thisIsNewPassword@ac-phmgerl-shard-00-00.j3buj6q.mongodb.net:27017,ac-phmgerl-shard-00-01.j3buj6q.mongodb.net:27017,ac-phmgerl-shard-00-02.j3buj6q.mongodb.net:27017/major_project?replicaSet=atlas-ieqoe1-shard-0&ssl=true&authSource=admin';
const SHOULD_CLEAN = process.argv.includes('--clean');
const HISTORY_DAYS = 90;
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomFloat(min, max, decimals = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(randomInt(8, 20), randomInt(0, 59), randomInt(0, 59), 0);
    return d;
}
// ---------------------------------------------------------------------------
// Data Definitions
// ---------------------------------------------------------------------------
const usersData = [
    { name: 'Rajesh Kumar', email: 'admin@scm.dev', role: 'admin' },
    { name: 'Priya Sharma', email: 'priya.wh@scm.dev', role: 'warehouse_manager' },
    { name: 'Amit Patel', email: 'amit.wh@scm.dev', role: 'warehouse_manager' },
    { name: 'Sneha Reddy', email: 'sneha.wh@scm.dev', role: 'warehouse_manager' },
    { name: 'Vikram Singh', email: 'vikram.proc@scm.dev', role: 'procurement_officer' },
    { name: 'Ananya Gupta', email: 'ananya.proc@scm.dev', role: 'procurement_officer' },
];
const warehousesData = [
    {
        name: 'Central Warehouse Mumbai',
        code: 'WHCENMUM',
        location: {
            address: '45 Industrial Park, Andheri East',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            pincode: '400069',
            coordinates: { latitude: 19.076, longitude: 72.8777 },
        },
        totalCapacity: 12000,
        usedCapacity: 9800, // ~82% – overstocked for optimization agent to detect
        zones: [
            { zoneCode: 'MUM-BLK', type: 'bulk', capacityUnits: 5000, currentLoad: 4200 },
            { zoneCode: 'MUM-FM', type: 'fast_moving', capacityUnits: 4000, currentLoad: 3600 },
            { zoneCode: 'MUM-GEN', type: 'general', capacityUnits: 3000, currentLoad: 2000 },
        ],
    },
    {
        name: 'North Hub Delhi',
        code: 'WHNORDEL',
        location: {
            address: '12 Logistics Complex, Narela',
            city: 'Delhi',
            state: 'Delhi',
            country: 'India',
            pincode: '110040',
            coordinates: { latitude: 28.7041, longitude: 77.1025 },
        },
        totalCapacity: 9000,
        usedCapacity: 5850, // ~65% – balanced
        zones: [
            { zoneCode: 'DEL-FM', type: 'fast_moving', capacityUnits: 4000, currentLoad: 2800 },
            { zoneCode: 'DEL-GEN', type: 'general', capacityUnits: 3000, currentLoad: 1850 },
            { zoneCode: 'DEL-FRG', type: 'fragile', capacityUnits: 2000, currentLoad: 1200 },
        ],
    },
    {
        name: 'South Hub Bangalore',
        code: 'WHSOUBLR',
        location: {
            address: '78 Tech Park Rd, Whitefield',
            city: 'Bangalore',
            state: 'Karnataka',
            country: 'India',
            pincode: '560066',
            coordinates: { latitude: 12.9716, longitude: 77.5946 },
        },
        totalCapacity: 8000,
        usedCapacity: 3200, // ~40% – understocked for optimization agent
        zones: [
            { zoneCode: 'BLR-SM', type: 'slow_moving', capacityUnits: 3000, currentLoad: 1200 },
            { zoneCode: 'BLR-GEN', type: 'general', capacityUnits: 3000, currentLoad: 1200 },
            { zoneCode: 'BLR-FM', type: 'fast_moving', capacityUnits: 2000, currentLoad: 800 },
        ],
    },
    {
        name: 'East Hub Kolkata',
        code: 'WHEASKLK',
        location: {
            address: '33 Salt Lake Sector V',
            city: 'Kolkata',
            state: 'West Bengal',
            country: 'India',
            pincode: '700091',
            coordinates: { latitude: 22.5726, longitude: 88.3639 },
        },
        totalCapacity: 7000,
        usedCapacity: 5950, // ~85% – overstocked
        zones: [
            { zoneCode: 'KLK-BLK', type: 'bulk', capacityUnits: 3500, currentLoad: 3100 },
            { zoneCode: 'KLK-GEN', type: 'general', capacityUnits: 3500, currentLoad: 2850 },
        ],
    },
];
const productsData = [
    { sku: 'PEN-BP-001', name: 'Ballpoint Pen Blue (Pack of 10)', category: 'writing_instruments', unit: 'pack', unitPrice: 85, reorderPoint: 150, safetyStock: 60, reorderQty: 500, leadTimeDays: 3 },
    { sku: 'PEN-GEL-002', name: 'Gel Pen Black Premium', category: 'writing_instruments', unit: 'piece', unitPrice: 25, reorderPoint: 200, safetyStock: 80, reorderQty: 1000, leadTimeDays: 4 },
    { sku: 'PPR-A4-001', name: 'A4 Copier Paper 75 GSM', category: 'paper_products', unit: 'ream', unitPrice: 245, reorderPoint: 50, safetyStock: 20, reorderQty: 200, leadTimeDays: 2 },
    { sku: 'PPR-A3-002', name: 'A3 Drawing Paper 120 GSM', category: 'paper_products', unit: 'ream', unitPrice: 420, reorderPoint: 30, safetyStock: 10, reorderQty: 80, leadTimeDays: 5 },
    { sku: 'OFF-STP-001', name: 'Heavy Duty Stapler', category: 'office_supplies', unit: 'piece', unitPrice: 350, reorderPoint: 40, safetyStock: 15, reorderQty: 100, leadTimeDays: 7 },
    { sku: 'OFF-TAPE-002', name: 'Transparent Tape Roll 24mm', category: 'office_supplies', unit: 'piece', unitPrice: 35, reorderPoint: 100, safetyStock: 40, reorderQty: 300, leadTimeDays: 3 },
    { sku: 'ART-MARK-001', name: 'Whiteboard Marker Set (4 Colors)', category: 'art_supplies', unit: 'set', unitPrice: 180, reorderPoint: 60, safetyStock: 25, reorderQty: 200, leadTimeDays: 4 },
    { sku: 'ART-SKTCH-002', name: 'Sketch Pad A4 50 Sheets', category: 'art_supplies', unit: 'piece', unitPrice: 120, reorderPoint: 45, safetyStock: 15, reorderQty: 150, leadTimeDays: 5 },
    { sku: 'FIL-BINDER-001', name: 'Ring Binder A4 2-inch', category: 'filing_storage', unit: 'piece', unitPrice: 150, reorderPoint: 50, safetyStock: 20, reorderQty: 120, leadTimeDays: 6 },
    { sku: 'FIL-FOLDER-002', name: 'Manila File Folder (Pack of 25)', category: 'filing_storage', unit: 'pack', unitPrice: 210, reorderPoint: 40, safetyStock: 15, reorderQty: 100, leadTimeDays: 4 },
    { sku: 'DSK-ORGNZ-001', name: 'Desk Organizer 5-Slot Wooden', category: 'desk_accessories', unit: 'piece', unitPrice: 550, reorderPoint: 25, safetyStock: 10, reorderQty: 60, leadTimeDays: 10 },
    { sku: 'DSK-PAD-002', name: 'Desk Mouse Pad Large', category: 'desk_accessories', unit: 'piece', unitPrice: 199, reorderPoint: 35, safetyStock: 12, reorderQty: 80, leadTimeDays: 5 },
    { sku: 'OFF-CLIP-003', name: 'Binder Clips Assorted (Box of 48)', category: 'office_supplies', unit: 'box', unitPrice: 95, reorderPoint: 80, safetyStock: 30, reorderQty: 250, leadTimeDays: 3 },
    { sku: 'PEN-HGHL-003', name: 'Highlighter Set 6 Colors', category: 'writing_instruments', unit: 'set', unitPrice: 140, reorderPoint: 70, safetyStock: 25, reorderQty: 200, leadTimeDays: 4 },
    { sku: 'PPR-NOTE-003', name: 'Sticky Notes 3x3 inch (Pack of 12)', category: 'paper_products', unit: 'pack', unitPrice: 160, reorderPoint: 60, safetyStock: 20, reorderQty: 180, leadTimeDays: 3 },
];
const suppliersData = [
    {
        companyName: 'Premier Stationery Supplies',
        contactEmail: 'orders@premierstationery.in',
        contactPhone: '+91-22-45678901',
        address: '101 MIDC Industrial Area, Andheri East, Mumbai 400069',
        rating: 4.5,
        isApproved: true,
        currentContractTerms: { paymentTermsDays: 30, deliveryTerms: 'FOB Mumbai Warehouse', returnPolicy: '15-day return for defective items', validUntil: new Date('2027-03-31') },
        negotiationStats: { totalNegotiations: 24, acceptedOffers: 18, averageSavingsPercent: 8.5 },
    },
    {
        companyName: 'Office Depot India Pvt Ltd',
        contactEmail: 'supply@officedepotindia.co.in',
        contactPhone: '+91-11-34567890',
        address: '55 Okhla Industrial Estate Phase 2, New Delhi 110020',
        rating: 4.2,
        isApproved: true,
        currentContractTerms: { paymentTermsDays: 45, deliveryTerms: 'Door delivery to any warehouse', returnPolicy: '30-day full return policy', validUntil: new Date('2026-12-31') },
        negotiationStats: { totalNegotiations: 15, acceptedOffers: 11, averageSavingsPercent: 6.2 },
    },
    {
        companyName: 'South India Paper Mills',
        contactEmail: 'sales@sipapermill.in',
        contactPhone: '+91-80-23456789',
        address: '7 Paper Mill Rd, Peenya Industrial Area, Bangalore 560058',
        rating: 3.8,
        isApproved: true,
        currentContractTerms: { paymentTermsDays: 60, deliveryTerms: 'Ex-works Bangalore factory', returnPolicy: '7-day return for manufacturing defects only', validUntil: new Date('2026-09-30') },
        negotiationStats: { totalNegotiations: 9, acceptedOffers: 5, averageSavingsPercent: 12.1 },
    },
    {
        companyName: 'Global Art & Craft Co',
        contactEmail: 'bulk@globalartcraft.in',
        contactPhone: '+91-33-56789012',
        address: '22 Park Street, Kolkata 700016',
        rating: 3.5,
        isApproved: false,
        negotiationStats: { totalNegotiations: 3, acceptedOffers: 1, averageSavingsPercent: 4.0 },
    },
];
const demandProfiles = [
    // High-demand fast moving (pens)
    { baseWeekday: 40, baseWeekend: 12, trend: 'rising', volatility: 0.3, spikeChance: 0.05 },
    { baseWeekday: 55, baseWeekend: 15, trend: 'stable', volatility: 0.25, spikeChance: 0.04 },
    // Paper products – seasonal (higher mid-month)
    { baseWeekday: 18, baseWeekend: 5, trend: 'seasonal', volatility: 0.35, spikeChance: 0.08 },
    { baseWeekday: 8, baseWeekend: 2, trend: 'falling', volatility: 0.4, spikeChance: 0.03 },
    // Office supplies – stable
    { baseWeekday: 6, baseWeekend: 1, trend: 'stable', volatility: 0.2, spikeChance: 0.02 },
    { baseWeekday: 25, baseWeekend: 8, trend: 'rising', volatility: 0.3, spikeChance: 0.06 },
    // Art supplies
    { baseWeekday: 12, baseWeekend: 6, trend: 'seasonal', volatility: 0.35, spikeChance: 0.04 },
    { baseWeekday: 10, baseWeekend: 4, trend: 'stable', volatility: 0.25, spikeChance: 0.03 },
    // Filing
    { baseWeekday: 8, baseWeekend: 2, trend: 'falling', volatility: 0.2, spikeChance: 0.02 },
    { baseWeekday: 14, baseWeekend: 4, trend: 'stable', volatility: 0.3, spikeChance: 0.05 },
    // Desk accessories
    { baseWeekday: 4, baseWeekend: 1, trend: 'rising', volatility: 0.35, spikeChance: 0.03 },
    { baseWeekday: 7, baseWeekend: 2, trend: 'stable', volatility: 0.25, spikeChance: 0.02 },
    // More office supplies
    { baseWeekday: 20, baseWeekend: 6, trend: 'rising', volatility: 0.3, spikeChance: 0.06 },
    // Highlighters
    { baseWeekday: 15, baseWeekend: 5, trend: 'seasonal', volatility: 0.35, spikeChance: 0.04 },
    // Sticky notes
    { baseWeekday: 22, baseWeekend: 8, trend: 'stable', volatility: 0.25, spikeChance: 0.05 },
];
/**
 * Calculate demand for a given day based on the profile.
 */
function getDemandForDay(profile, dayIndex, date) {
    const isWeekend = [0, 6].includes(date.getDay());
    let base = isWeekend ? profile.baseWeekend : profile.baseWeekday;
    // Apply trend
    const progress = dayIndex / HISTORY_DAYS; // 0..1
    switch (profile.trend) {
        case 'rising':
            base = Math.round(base * (0.75 + 0.5 * progress));
            break;
        case 'falling':
            base = Math.round(base * (1.25 - 0.5 * progress));
            break;
        case 'seasonal': {
            const dayOfMonth = date.getDate();
            // Peaks mid-month, dips at start/end
            const seasonalMultiplier = 0.7 + 0.6 * Math.sin((dayOfMonth / 30) * Math.PI);
            base = Math.round(base * seasonalMultiplier);
            break;
        }
        case 'stable':
        default:
            break;
    }
    // Apply volatility
    const noise = 1 + (Math.random() - 0.5) * 2 * profile.volatility;
    base = Math.max(0, Math.round(base * noise));
    // Spike
    if (Math.random() < profile.spikeChance) {
        base = Math.round(base * randomFloat(2.5, 4.0));
    }
    return Math.max(0, base);
}
// Inventory distribution weights per warehouse (creates imbalances for optimization agent)
// [Mumbai, Delhi, Bangalore, Kolkata]
const warehouseStockWeights = [0.40, 0.25, 0.12, 0.23];
// ---------------------------------------------------------------------------
// Main Seed Function
// ---------------------------------------------------------------------------
async function seed() {
    console.log('🌱 Starting seed script...');
    console.log(`   MongoDB: ${MONGODB_URI}`);
    console.log(`   Clean mode: ${SHOULD_CLEAN}`);
    console.log(`   History days: ${HISTORY_DAYS}\n`);
    await mongoose_1.default.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    // ---------- Clean ----------
    if (SHOULD_CLEAN) {
        console.log('🧹 Cleaning existing data...');
        await Promise.all([
            model_1.default.deleteMany({}),
            model_2.default.deleteMany({}),
            model_3.default.deleteMany({}),
            model_4.default.deleteMany({}),
            model_5.default.deleteMany({}),
            model_6.default.deleteMany({}),
        ]);
        console.log('   Done.\n');
    }
    // ---------- 1. Users ----------
    console.log('👤 Creating users...');
    const passwordHash = await bcryptjs_1.default.hash('Password123!', 10);
    const users = await model_1.default.insertMany(usersData.map((u) => ({ ...u, passwordHash, isActive: true })));
    console.log(`   Created ${users.length} users`);
    const adminUser = users[0];
    const whManagers = users.filter((u) => u.role === 'warehouse_manager');
    const procOfficers = users.filter((u) => u.role === 'procurement_officer');
    // ---------- 2. Warehouses ----------
    console.log('🏭 Creating warehouses...');
    const warehouses = await model_3.default.insertMany(warehousesData.map((w, i) => ({
        ...w,
        manager: whManagers[i % whManagers.length]._id,
        isActive: true,
    })));
    console.log(`   Created ${warehouses.length} warehouses`);
    // Assign warehouses to managers
    for (let i = 0; i < whManagers.length; i++) {
        const assigned = warehouses
            .filter((_, idx) => idx % whManagers.length === i)
            .map((w) => w._id);
        await model_1.default.findByIdAndUpdate(whManagers[i]._id, { assignedWarehouses: assigned });
    }
    // ---------- 3. Suppliers ----------
    console.log('🏢 Creating suppliers...');
    const suppliers = await model_4.default.insertMany(suppliersData);
    console.log(`   Created ${suppliers.length} suppliers`);
    // ---------- 4. Products ----------
    console.log('📦 Creating products...');
    const products = await model_2.default.insertMany(productsData.map((p, i) => ({
        ...p,
        description: `High quality ${p.name.toLowerCase()} for office and educational use.`,
        primarySupplier: suppliers[i % suppliers.length]._id,
        alternateSuppliers: [suppliers[(i + 1) % suppliers.length]._id],
        isActive: true,
        uploadedBy: adminUser._id,
    })));
    console.log(`   Created ${products.length} products`);
    // Update supplier catalogs with products
    for (let si = 0; si < suppliers.length; si++) {
        const catalogProducts = products
            .filter((_, pi) => pi % suppliers.length === si || (pi + 1) % suppliers.length === si)
            .map((p) => ({
            product: p._id,
            unitPrice: p.unitPrice * randomFloat(0.85, 0.95), // supplier price slightly lower
            leadTimeDays: p.leadTimeDays,
            moq: Math.max(10, Math.round(p.reorderQty * 0.2)),
        }));
        await model_4.default.findByIdAndUpdate(suppliers[si]._id, { catalogProducts });
    }
    console.log('   Updated supplier catalogs');
    // ---------- 5. Inventory + Transactions ----------
    console.log('📊 Creating inventory with 90-day transaction history...');
    let totalTransactions = 0;
    for (let pi = 0; pi < products.length; pi++) {
        const product = products[pi];
        const profile = demandProfiles[pi];
        for (let wi = 0; wi < warehouses.length; wi++) {
            const warehouse = warehouses[wi];
            const weight = warehouseStockWeights[wi];
            // Build 90 days of transactions
            const transactions = [];
            // Start with an initial purchase that sets up stock
            const initialStock = Math.round(product.reorderQty * weight * randomFloat(2.0, 3.5));
            transactions.push({
                type: 'purchase',
                quantity: initialStock,
                referenceDoc: `INIT-${product.sku}-${warehouse.code}`,
                performedBy: procOfficers[0]._id,
                notes: 'Initial stock setup',
                timestamp: daysAgo(HISTORY_DAYS + 1),
            });
            let runningStock = initialStock;
            for (let day = HISTORY_DAYS; day >= 0; day--) {
                const date = daysAgo(day);
                const demand = getDemandForDay(profile, HISTORY_DAYS - day, date);
                if (demand > 0 && runningStock > 0) {
                    const saleQty = Math.min(demand, runningStock);
                    // Split large demands into 1-3 sale transactions to look realistic
                    const numSales = saleQty > 20 ? randomInt(1, 3) : 1;
                    let remaining = saleQty;
                    for (let s = 0; s < numSales && remaining > 0; s++) {
                        const qty = s === numSales - 1 ? remaining : randomInt(1, remaining);
                        remaining -= qty;
                        transactions.push({
                            type: 'sale',
                            quantity: qty,
                            referenceDoc: `SO-${date.toISOString().slice(0, 10).replace(/-/g, '')}-${randomInt(100, 999)}`,
                            performedBy: whManagers[wi % whManagers.length]._id,
                            timestamp: new Date(date.getTime() + randomInt(0, 8) * 3600000),
                        });
                        runningStock -= qty;
                    }
                }
                // Periodic restocking when low
                if (runningStock < product.reorderPoint * weight && Math.random() < 0.6) {
                    const restockQty = Math.round(product.reorderQty * weight * randomFloat(0.8, 1.2));
                    transactions.push({
                        type: 'purchase',
                        quantity: restockQty,
                        referenceDoc: `PO-RESTOCK-${randomInt(100000, 999999)}`,
                        performedBy: procOfficers[wi % procOfficers.length]._id,
                        notes: 'Auto-replenishment restock',
                        timestamp: new Date(date.getTime() + randomInt(10, 16) * 3600000),
                    });
                    runningStock += restockQty;
                }
                // Occasional transfers between warehouses (for variety)
                if (day % 15 === 0 && wi < warehouses.length - 1 && Math.random() < 0.3) {
                    const transferQty = randomInt(5, Math.max(6, Math.round(runningStock * 0.05)));
                    if (transferQty < runningStock) {
                        transactions.push({
                            type: 'transfer_out',
                            quantity: transferQty,
                            referenceDoc: `TRF-${warehouse.code}-${warehouses[wi + 1].code}-${randomInt(1000, 9999)}`,
                            performedBy: whManagers[wi % whManagers.length]._id,
                            notes: `Transfer to ${warehouses[wi + 1].name}`,
                            timestamp: new Date(date.getTime() + 12 * 3600000),
                        });
                        runningStock -= transferQty;
                    }
                }
                // Rare returns and damage adjustments
                if (Math.random() < 0.02) {
                    const returnQty = randomInt(1, 5);
                    transactions.push({
                        type: 'return',
                        quantity: returnQty,
                        performedBy: whManagers[wi % whManagers.length]._id,
                        notes: 'Customer return – items in good condition',
                        timestamp: new Date(date.getTime() + randomInt(9, 17) * 3600000),
                    });
                    runningStock += returnQty;
                }
                if (Math.random() < 0.01) {
                    const dmgQty = randomInt(1, 3);
                    if (dmgQty < runningStock) {
                        transactions.push({
                            type: 'damage',
                            quantity: dmgQty,
                            performedBy: whManagers[wi % whManagers.length]._id,
                            notes: 'Damaged during handling',
                            timestamp: new Date(date.getTime() + randomInt(9, 17) * 3600000),
                        });
                        runningStock -= dmgQty;
                    }
                }
            }
            runningStock = Math.max(0, runningStock);
            const reservedStock = randomInt(0, Math.min(10, Math.floor(runningStock * 0.05)));
            const availableStock = Math.max(0, runningStock - reservedStock);
            // Determine if replenishment is needed
            const effectiveReorderPoint = Math.round(product.reorderPoint * weight);
            const effectiveSafetyStock = Math.round(product.safetyStock * weight);
            const replenishmentTriggered = runningStock <= effectiveReorderPoint;
            await model_5.default.create({
                product: product._id,
                warehouse: warehouse._id,
                currentStock: runningStock,
                reservedStock,
                availableStock,
                reorderPoint: effectiveReorderPoint,
                safetyStock: effectiveSafetyStock,
                replenishmentTriggered,
                lastReplenishmentAt: replenishmentTriggered ? daysAgo(randomInt(1, 5)) : undefined,
                transactions,
                zone: warehouse.zones[0]?.zoneCode,
            });
            totalTransactions += transactions.length;
        }
        process.stdout.write(`   Product ${pi + 1}/${products.length} (${product.sku}) done\n`);
    }
    console.log(`   Created ${products.length * warehouses.length} inventory records`);
    console.log(`   Generated ${totalTransactions} total transactions\n`);
    // ---------- 6. Purchase Orders ----------
    console.log('📝 Creating purchase orders...');
    const poStatuses = [
        { status: 'draft', triggeredBy: 'manual' },
        { status: 'pending_approval', triggeredBy: 'auto_replenishment' },
        { status: 'approved', triggeredBy: 'manual' },
        { status: 'sent_to_supplier', triggeredBy: 'negotiation_agent' },
        { status: 'acknowledged', triggeredBy: 'auto_replenishment' },
        { status: 'partially_received', triggeredBy: 'manual' },
        { status: 'fully_received', triggeredBy: 'auto_replenishment' },
        { status: 'cancelled', triggeredBy: 'manual' },
    ];
    const purchaseOrders = [];
    for (let i = 0; i < 12; i++) {
        const supplier = suppliers[i % suppliers.length];
        const warehouse = warehouses[i % warehouses.length];
        const config = poStatuses[i % poStatuses.length];
        // Pick 1-4 random products for each PO
        const numItems = randomInt(1, 4);
        const selectedProducts = [];
        const usedIndices = new Set();
        for (let j = 0; j < numItems; j++) {
            let idx;
            do {
                idx = randomInt(0, products.length - 1);
            } while (usedIndices.has(idx));
            usedIndices.add(idx);
            selectedProducts.push(products[idx]);
        }
        const lineItems = selectedProducts.map((p) => {
            const qty = randomInt(Math.round(p.reorderQty * 0.5), Math.round(p.reorderQty * 1.5));
            const receivedQty = config.status === 'fully_received'
                ? qty
                : config.status === 'partially_received'
                    ? randomInt(Math.round(qty * 0.3), Math.round(qty * 0.7))
                    : 0;
            return {
                product: p._id,
                sku: p.sku,
                orderedQty: qty,
                receivedQty,
                unitPrice: p.unitPrice,
                totalPrice: qty * p.unitPrice,
            };
        });
        const totalAmount = lineItems.reduce((sum, li) => sum + li.totalPrice, 0);
        const triggeredAt = daysAgo(randomInt(1, 30));
        const isApproved = ['approved', 'sent_to_supplier', 'acknowledged', 'partially_received', 'fully_received'].includes(config.status);
        purchaseOrders.push({
            poNumber: `PO-${String(Date.now()).slice(-6)}${String(i).padStart(3, '0')}`,
            supplier: supplier._id,
            warehouse: warehouse._id,
            lineItems,
            totalAmount,
            currency: 'INR',
            status: config.status,
            triggeredBy: config.triggeredBy,
            triggeredAt,
            createdBy: procOfficers[i % procOfficers.length]._id,
            approvedBy: isApproved ? adminUser._id : undefined,
            approvedAt: isApproved ? new Date(triggeredAt.getTime() + 86400000) : undefined,
            expectedDeliveryDate: new Date(triggeredAt.getTime() + randomInt(3, 14) * 86400000),
            notes: `Seed PO #${i + 1} – ${config.status} sample`,
        });
    }
    await model_6.default.insertMany(purchaseOrders);
    console.log(`   Created ${purchaseOrders.length} purchase orders\n`);
    // ---------- Summary ----------
    console.log('═══════════════════════════════════════════════');
    console.log('  SEED COMPLETE – Summary');
    console.log('═══════════════════════════════════════════════');
    console.log(`  Users:            ${users.length}`);
    console.log(`  Warehouses:       ${warehouses.length}`);
    console.log(`  Products:         ${products.length}`);
    console.log(`  Suppliers:        ${suppliers.length}`);
    console.log(`  Inventory Records:${products.length * warehouses.length}`);
    console.log(`  Transactions:     ${totalTransactions}`);
    console.log(`  Purchase Orders:  ${purchaseOrders.length}`);
    console.log('═══════════════════════════════════════════════');
    console.log('\n  Login credentials: any user email + "Password123!"');
    console.log('  E.g.: admin@scm.dev / Password123!\n');
    await mongoose_1.default.disconnect();
    console.log('✅ Disconnected from MongoDB. Done!');
}
seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    mongoose_1.default.disconnect();
    process.exit(1);
});
