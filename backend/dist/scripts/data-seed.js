"use strict";
/**
 * data-seed.ts
 *
 * Comprehensive faker-based seed script for the StationeryChain supply chain system.
 * Generates realistic data for ALL collections:
 *   Users, Warehouses, Suppliers, Products, Inventory (with 90-day history),
 *   PurchaseOrders, NegotiationSessions, DemandForecasts,
 *   BlockchainLogs, Notifications, WarehouseOptimizationRecommendations
 *
 * Usage:
 *   npx tsx src/scripts/data-seed.ts
 *   npx tsx src/scripts/data-seed.ts --clean
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const faker_1 = require("@faker-js/faker");
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const model_1 = __importDefault(require("../modules/user/model"));
const model_2 = __importDefault(require("../modules/product/model"));
const model_3 = __importDefault(require("../modules/warehouse/model"));
const model_4 = __importDefault(require("../modules/supplier/model"));
const model_5 = __importDefault(require("../modules/inventory/model"));
const model_6 = __importDefault(require("../modules/purchase-order/model"));
const model_7 = __importDefault(require("../modules/negotiation/model"));
const model_8 = __importDefault(require("../modules/forecast/model"));
const model_9 = __importDefault(require("../modules/blockchain/model"));
const model_10 = __importDefault(require("../modules/notification/model"));
const model_11 = __importDefault(require("../modules/warehouse-optimization/model"));
// ─── Config ────────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://jayesh040405_db_user:thisIsNewPassword@ac-phmgerl-shard-00-00.j3buj6q.mongodb.net:27017,ac-phmgerl-shard-00-01.j3buj6q.mongodb.net:27017,ac-phmgerl-shard-00-02.j3buj6q.mongodb.net:27017/major_project?replicaSet=atlas-ieqoe1-shard-0&ssl=true&authSource=admin';
const SHOULD_CLEAN = process.argv.includes('--clean');
const HISTORY_DAYS = 90;
// ─── Indian City Data ───────────────────────────────────────────────────────
const INDIAN_CITIES = [
    { city: 'Mumbai', state: 'Maharashtra', country: 'India', basePincode: '400', lat: 19.076, lng: 72.8777 },
    { city: 'Delhi', state: 'Delhi', country: 'India', basePincode: '110', lat: 28.6139, lng: 77.209 },
    { city: 'Bangalore', state: 'Karnataka', country: 'India', basePincode: '560', lat: 12.9716, lng: 77.5946 },
    { city: 'Chennai', state: 'Tamil Nadu', country: 'India', basePincode: '600', lat: 13.0827, lng: 80.2707 },
    { city: 'Hyderabad', state: 'Telangana', country: 'India', basePincode: '500', lat: 17.385, lng: 78.4867 },
    { city: 'Kolkata', state: 'West Bengal', country: 'India', basePincode: '700', lat: 22.5726, lng: 88.3639 },
    { city: 'Pune', state: 'Maharashtra', country: 'India', basePincode: '411', lat: 18.5204, lng: 73.8567 },
    { city: 'Ahmedabad', state: 'Gujarat', country: 'India', basePincode: '380', lat: 23.0225, lng: 72.5714 },
];
// ─── Stationery Product Catalog ─────────────────────────────────────────────
const PRODUCT_CATALOG = [
    { sku: 'WI-BP-001', name: 'Ballpoint Pen Blue (Pack of 10)', category: 'writing_instruments', unit: 'pack', unitPrice: 85, reorderPoint: 150, safetyStock: 60, reorderQty: 500, leadTimeDays: 3 },
    { sku: 'WI-GEL-002', name: 'Gel Pen Black Premium', category: 'writing_instruments', unit: 'piece', unitPrice: 25, reorderPoint: 200, safetyStock: 80, reorderQty: 1000, leadTimeDays: 4 },
    { sku: 'WI-HGHL-003', name: 'Highlighter Set 6 Colors', category: 'writing_instruments', unit: 'set', unitPrice: 140, reorderPoint: 70, safetyStock: 25, reorderQty: 200, leadTimeDays: 4 },
    { sku: 'WI-PENCIL-004', name: 'HB Pencil (Box of 12)', category: 'writing_instruments', unit: 'box', unitPrice: 60, reorderPoint: 120, safetyStock: 40, reorderQty: 400, leadTimeDays: 3 },
    { sku: 'WI-MRKR-005', name: 'Permanent Marker Black', category: 'writing_instruments', unit: 'piece', unitPrice: 45, reorderPoint: 100, safetyStock: 35, reorderQty: 300, leadTimeDays: 3 },
    { sku: 'PP-A4-001', name: 'A4 Copier Paper 75 GSM (Ream)', category: 'paper_products', unit: 'ream', unitPrice: 245, reorderPoint: 50, safetyStock: 20, reorderQty: 200, leadTimeDays: 2 },
    { sku: 'PP-A3-002', name: 'A3 Drawing Paper 120 GSM', category: 'paper_products', unit: 'ream', unitPrice: 420, reorderPoint: 30, safetyStock: 10, reorderQty: 80, leadTimeDays: 5 },
    { sku: 'PP-NOTE-003', name: 'Sticky Notes 3x3 inch (Pack of 12)', category: 'paper_products', unit: 'pack', unitPrice: 160, reorderPoint: 60, safetyStock: 20, reorderQty: 180, leadTimeDays: 3 },
    { sku: 'PP-NB-004', name: 'Spiral Notebook A4 200 Pages', category: 'paper_products', unit: 'piece', unitPrice: 120, reorderPoint: 80, safetyStock: 30, reorderQty: 250, leadTimeDays: 4 },
    { sku: 'PP-INDEX-005', name: 'Index Card 4x6 inch (Pack of 100)', category: 'paper_products', unit: 'pack', unitPrice: 75, reorderPoint: 60, safetyStock: 20, reorderQty: 200, leadTimeDays: 3 },
    { sku: 'OS-STP-001', name: 'Heavy Duty Stapler 24/6', category: 'office_supplies', unit: 'piece', unitPrice: 350, reorderPoint: 40, safetyStock: 15, reorderQty: 100, leadTimeDays: 7 },
    { sku: 'OS-TAPE-002', name: 'Transparent Tape Roll 24mm', category: 'office_supplies', unit: 'piece', unitPrice: 35, reorderPoint: 100, safetyStock: 40, reorderQty: 300, leadTimeDays: 3 },
    { sku: 'OS-CLIP-003', name: 'Binder Clips Assorted (Box of 48)', category: 'office_supplies', unit: 'box', unitPrice: 95, reorderPoint: 80, safetyStock: 30, reorderQty: 250, leadTimeDays: 3 },
    { sku: 'OS-SCSR-004', name: 'Stainless Steel Scissors 8 inch', category: 'office_supplies', unit: 'piece', unitPrice: 180, reorderPoint: 50, safetyStock: 15, reorderQty: 150, leadTimeDays: 5 },
    { sku: 'OS-GLUE-005', name: 'UHU Glue Stick 40g', category: 'office_supplies', unit: 'piece', unitPrice: 55, reorderPoint: 90, safetyStock: 30, reorderQty: 280, leadTimeDays: 3 },
    { sku: 'AS-WBMK-001', name: 'Whiteboard Marker Set (4 Colors)', category: 'art_supplies', unit: 'set', unitPrice: 180, reorderPoint: 60, safetyStock: 25, reorderQty: 200, leadTimeDays: 4 },
    { sku: 'AS-SKTCH-002', name: 'Sketch Pad A4 50 Sheets', category: 'art_supplies', unit: 'piece', unitPrice: 120, reorderPoint: 45, safetyStock: 15, reorderQty: 150, leadTimeDays: 5 },
    { sku: 'FS-BINDER-001', name: 'Ring Binder A4 2-inch', category: 'filing_storage', unit: 'piece', unitPrice: 150, reorderPoint: 50, safetyStock: 20, reorderQty: 120, leadTimeDays: 6 },
    { sku: 'FS-FOLDER-002', name: 'Manila File Folder (Pack of 25)', category: 'filing_storage', unit: 'pack', unitPrice: 210, reorderPoint: 40, safetyStock: 15, reorderQty: 100, leadTimeDays: 4 },
    { sku: 'DA-ORGNZ-001', name: 'Desk Organizer 5-Slot Wooden', category: 'desk_accessories', unit: 'piece', unitPrice: 550, reorderPoint: 25, safetyStock: 10, reorderQty: 60, leadTimeDays: 10 },
];
// ─── Demand Profiles (creates varied AI forecasting scenarios) ───────────────
const DEMAND_PROFILES = [
    { baseWeekday: 40, baseWeekend: 12, trend: 'rising', volatility: 0.3, spikeChance: 0.05 },
    { baseWeekday: 55, baseWeekend: 15, trend: 'stable', volatility: 0.25, spikeChance: 0.04 },
    { baseWeekday: 15, baseWeekend: 5, trend: 'seasonal', volatility: 0.35, spikeChance: 0.06 },
    { baseWeekday: 8, baseWeekend: 2, trend: 'falling', volatility: 0.4, spikeChance: 0.03 },
    { baseWeekday: 6, baseWeekend: 1, trend: 'stable', volatility: 0.2, spikeChance: 0.02 },
    { baseWeekday: 25, baseWeekend: 8, trend: 'rising', volatility: 0.3, spikeChance: 0.06 },
    { baseWeekday: 12, baseWeekend: 6, trend: 'seasonal', volatility: 0.35, spikeChance: 0.04 },
    { baseWeekday: 10, baseWeekend: 4, trend: 'stable', volatility: 0.25, spikeChance: 0.03 },
    { baseWeekday: 8, baseWeekend: 2, trend: 'falling', volatility: 0.2, spikeChance: 0.02 },
    { baseWeekday: 14, baseWeekend: 4, trend: 'stable', volatility: 0.3, spikeChance: 0.05 },
    { baseWeekday: 4, baseWeekend: 1, trend: 'rising', volatility: 0.35, spikeChance: 0.03 },
    { baseWeekday: 7, baseWeekend: 2, trend: 'stable', volatility: 0.25, spikeChance: 0.02 },
    { baseWeekday: 20, baseWeekend: 6, trend: 'rising', volatility: 0.3, spikeChance: 0.06 },
    { baseWeekday: 15, baseWeekend: 5, trend: 'seasonal', volatility: 0.35, spikeChance: 0.04 },
    { baseWeekday: 22, baseWeekend: 8, trend: 'stable', volatility: 0.25, spikeChance: 0.05 },
    { baseWeekday: 18, baseWeekend: 6, trend: 'rising', volatility: 0.3, spikeChance: 0.04 },
    { baseWeekday: 9, baseWeekend: 3, trend: 'stable', volatility: 0.2, spikeChance: 0.03 },
    { baseWeekday: 12, baseWeekend: 4, trend: 'falling', volatility: 0.25, spikeChance: 0.02 },
    { baseWeekday: 5, baseWeekend: 1, trend: 'rising', volatility: 0.35, spikeChance: 0.03 },
    { baseWeekday: 8, baseWeekend: 3, trend: 'seasonal', volatility: 0.3, spikeChance: 0.04 },
];
// Warehouse stock distribution weights (creates imbalances for optimization agent)
const WH_STOCK_WEIGHTS = [0.35, 0.25, 0.15, 0.12, 0.08, 0.05];
// ─── Helper Functions ────────────────────────────────────────────────────────
const ri = (min, max) => faker_1.faker.number.int({ min, max });
const rf = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;
const pick = (arr) => faker_1.faker.helpers.arrayElement(arr);
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(ri(8, 20), ri(0, 59), ri(0, 59), 0);
    return d;
}
function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
}
function generateTxHash() {
    return '0x' + crypto_1.default.randomBytes(32).toString('hex');
}
function indianPhone() {
    return `+91-${ri(70, 99)}-${ri(10000000, 99999999)}`;
}
function indianPincode(base) {
    return `${base}${ri(100, 999).toString().padStart(3, '0')}`;
}
function getDemandForDay(profile, dayIndex, date) {
    const isWeekend = [0, 6].includes(date.getDay());
    let base = isWeekend ? profile.baseWeekend : profile.baseWeekday;
    const progress = dayIndex / HISTORY_DAYS;
    switch (profile.trend) {
        case 'rising':
            base = Math.round(base * (0.75 + 0.5 * progress));
            break;
        case 'falling':
            base = Math.round(base * (1.25 - 0.5 * progress));
            break;
        case 'seasonal': {
            const dom = date.getDate();
            base = Math.round(base * (0.7 + 0.6 * Math.sin((dom / 30) * Math.PI)));
            break;
        }
    }
    const noise = 1 + (Math.random() - 0.5) * 2 * profile.volatility;
    base = Math.max(0, Math.round(base * noise));
    if (Math.random() < profile.spikeChance)
        base = Math.round(base * rf(2.5, 4.0));
    return Math.max(0, base);
}
// ─── Seeder Functions ────────────────────────────────────────────────────────
async function seedUsers(passwordHash, suppliers) {
    const users = [];
    // 1 admin
    users.push({
        name: faker_1.faker.person.fullName(),
        email: 'admin@scm.dev',
        passwordHash,
        role: 'admin',
        isActive: true,
        assignedWarehouses: [],
        notificationPreferences: { email: true, inApp: true, lowStockAlerts: true, poApprovals: true, negotiationUpdates: true },
    });
    // Test warehouse manager
    users.push({
        name: 'Test Warehouse Manager',
        email: 'warehouse@test.com',
        passwordHash,
        role: 'warehouse_manager',
        isActive: true,
        assignedWarehouses: [],
        notificationPreferences: { email: true, inApp: true, lowStockAlerts: true, poApprovals: false, negotiationUpdates: false },
    });
    // 4 additional warehouse managers (random)
    for (let i = 0; i < 4; i++) {
        const first = faker_1.faker.person.firstName();
        const last = faker_1.faker.person.lastName();
        users.push({
            name: `${first} ${last}`,
            email: faker_1.faker.internet.email({ firstName: first, lastName: last, provider: 'scm.dev' }).toLowerCase(),
            passwordHash,
            role: 'warehouse_manager',
            isActive: true,
            assignedWarehouses: [],
            notificationPreferences: { email: true, inApp: true, lowStockAlerts: true, poApprovals: false, negotiationUpdates: false },
        });
    }
    // Test procurement officer
    users.push({
        name: 'Test Procurement Officer',
        email: 'procurement@test.com',
        passwordHash,
        role: 'procurement_officer',
        isActive: true,
        assignedWarehouses: [],
        notificationPreferences: { email: true, inApp: true, lowStockAlerts: false, poApprovals: true, negotiationUpdates: true },
    });
    // 3 additional procurement officers (random)
    for (let i = 0; i < 3; i++) {
        const first = faker_1.faker.person.firstName();
        const last = faker_1.faker.person.lastName();
        users.push({
            name: `${first} ${last}`,
            email: faker_1.faker.internet.email({ firstName: first, lastName: last, provider: 'scm.dev' }).toLowerCase(),
            passwordHash,
            role: 'procurement_officer',
            isActive: true,
            assignedWarehouses: [],
            notificationPreferences: { email: true, inApp: true, lowStockAlerts: false, poApprovals: true, negotiationUpdates: true },
        });
    }
    // 3 test supplier users (linked to first 3 suppliers)
    const testSuppliers = suppliers?.slice(0, 3) || [];
    const supplierEmails = ['supplier1@test.com', 'supplier2@test.com', 'supplier3@test.com'];
    for (let i = 0; i < Math.min(3, testSuppliers.length); i++) {
        users.push({
            name: testSuppliers[i].companyName,
            email: supplierEmails[i],
            passwordHash,
            role: 'supplier',
            isActive: true,
            supplierRef: testSuppliers[i]._id,
            assignedWarehouses: [],
            notificationPreferences: { email: true, inApp: true, lowStockAlerts: false, poApprovals: false, negotiationUpdates: true },
        });
    }
    return model_1.default.insertMany(users);
}
async function seedWarehouses(managers) {
    const cities = faker_1.faker.helpers.shuffle([...INDIAN_CITIES]).slice(0, 6);
    const zoneTypes = [
        ['bulk', 'fast_moving', 'general'],
        ['fast_moving', 'general', 'fragile'],
        ['slow_moving', 'general', 'fast_moving'],
        ['bulk', 'general'],
        ['fast_moving', 'fragile'],
        ['general', 'slow_moving', 'bulk'],
    ];
    const capacities = [12000, 9000, 8000, 7500, 6000, 5500];
    const utilPercents = [0.82, 0.65, 0.40, 0.85, 0.55, 0.70];
    return model_3.default.insertMany(cities.map((loc, i) => {
        const total = capacities[i];
        const used = Math.round(total * utilPercents[i]);
        const zoneTypeList = zoneTypes[i % zoneTypes.length];
        const perZone = Math.round(total / zoneTypeList.length);
        return {
            name: `${loc.city} ${pick(['Central', 'North', 'South', 'East', 'West', 'Hub'])} Warehouse`,
            code: `WH${loc.city.slice(0, 3).toUpperCase()}${ri(100, 999)}`,
            location: {
                address: `${ri(1, 200)} ${faker_1.faker.location.street()}, ${pick(['Industrial Area', 'MIDC', 'SEZ', 'Logistics Park', 'Tech Park'])}`,
                city: loc.city,
                state: loc.state,
                country: loc.country,
                pincode: indianPincode(loc.basePincode),
                coordinates: {
                    latitude: loc.lat + rf(-0.05, 0.05),
                    longitude: loc.lng + rf(-0.05, 0.05),
                },
            },
            totalCapacity: total,
            usedCapacity: used,
            zones: zoneTypeList.map((type, zi) => ({
                zoneCode: `${loc.city.slice(0, 3).toUpperCase()}-${type.slice(0, 3).toUpperCase()}-${zi + 1}`,
                type,
                capacityUnits: perZone,
                currentLoad: Math.round(perZone * utilPercents[i] * rf(0.85, 1.0)),
            })),
            manager: managers[i % managers.length]._id,
            isActive: true,
        };
    }));
}
async function seedSuppliers() {
    const companyTypes = ['Pvt Ltd', 'Ltd', 'Enterprises', 'Traders', 'Industries', 'Corporation'];
    const domains = ['stationerysupplies', 'officepro', 'papermills', 'artcraft', 'deskessentials', 'writingtools'];
    return model_4.default.insertMany(Array.from({ length: 6 }, (_, i) => {
        const companyName = `${faker_1.faker.company.name().split(' ')[0]} ${pick(companyTypes)}`;
        const ratings = [4.5, 4.2, 3.8, 4.7, 3.5, 4.0];
        const paymentDays = [30, 45, 60, 30, 90, 45];
        const city = pick(INDIAN_CITIES);
        return {
            companyName,
            contactEmail: `orders@${domains[i]}.in`,
            contactPhone: indianPhone(),
            address: `${ri(1, 200)} ${faker_1.faker.location.street()}, ${city.city} ${indianPincode(city.basePincode)}`,
            rating: ratings[i],
            isApproved: i !== 4, // one unapproved supplier
            currentContractTerms: i < 4
                ? {
                    paymentTermsDays: paymentDays[i],
                    deliveryTerms: pick(['FOB Warehouse', 'Door Delivery', 'Ex-Works Factory', 'CIF Destination']),
                    returnPolicy: pick(['15-day return for defective items', '30-day full return policy', '7-day manufacturing defect return only', 'No returns after delivery']),
                    validUntil: faker_1.faker.date.future({ years: 2 }),
                }
                : undefined,
            negotiationStats: {
                totalNegotiations: ri(2, 30),
                acceptedOffers: ri(1, 20),
                averageSavingsPercent: rf(3, 15),
            },
        };
    }));
}
async function seedProducts(suppliers, adminUser) {
    const products = await model_2.default.insertMany(PRODUCT_CATALOG.map((p, i) => ({
        ...p,
        description: `Premium quality ${p.name.toLowerCase()} suitable for office, educational, and commercial use. ${faker_1.faker.lorem.sentence()}`,
        primarySupplier: suppliers[i % suppliers.length]._id,
        alternateSuppliers: [suppliers[(i + 1) % suppliers.length]._id],
        isActive: true,
        uploadedBy: adminUser._id,
    })));
    // Update each supplier's catalog
    for (let si = 0; si < suppliers.length; si++) {
        const catalogProducts = products
            .filter((_, pi) => pi % suppliers.length === si || (pi + 1) % suppliers.length === si)
            .map((p) => ({
            product: p._id,
            unitPrice: Math.round(p.unitPrice * rf(0.82, 0.95)),
            leadTimeDays: p.leadTimeDays,
            moq: Math.max(10, Math.round(p.reorderQty * 0.2)),
        }));
        await model_4.default.findByIdAndUpdate(suppliers[si]._id, { catalogProducts });
    }
    return products;
}
async function seedInventory(products, warehouses, whManagers, procOfficers) {
    let totalTransactions = 0;
    for (let pi = 0; pi < products.length; pi++) {
        const product = products[pi];
        const profile = DEMAND_PROFILES[pi % DEMAND_PROFILES.length];
        for (let wi = 0; wi < warehouses.length; wi++) {
            const warehouse = warehouses[wi];
            const weight = WH_STOCK_WEIGHTS[wi] ?? 0.05;
            const transactions = [];
            // Initial stock purchase
            const initialStock = Math.round(product.reorderQty * weight * rf(2.0, 3.5));
            transactions.push({
                type: 'purchase',
                quantity: initialStock,
                referenceDoc: `INIT-${product.sku}-${warehouse.code}`,
                performedBy: procOfficers[0]._id,
                notes: 'Initial stock setup — data seed',
                timestamp: daysAgo(HISTORY_DAYS + 1),
            });
            let runningStock = initialStock;
            for (let day = HISTORY_DAYS; day >= 0; day--) {
                const date = daysAgo(day);
                const demand = getDemandForDay(profile, HISTORY_DAYS - day, date);
                // Sales
                if (demand > 0 && runningStock > 0) {
                    const saleQty = Math.min(demand, runningStock);
                    const numSales = saleQty > 20 ? ri(1, 3) : 1;
                    let remaining = saleQty;
                    for (let s = 0; s < numSales && remaining > 0; s++) {
                        const qty = s === numSales - 1 ? remaining : ri(1, remaining);
                        remaining -= qty;
                        transactions.push({
                            type: 'sale',
                            quantity: qty,
                            referenceDoc: `SO-${date.toISOString().slice(0, 10).replace(/-/g, '')}-${ri(100, 999)}`,
                            performedBy: whManagers[wi % whManagers.length]._id,
                            timestamp: new Date(date.getTime() + ri(0, 8) * 3600000),
                        });
                        runningStock -= qty;
                    }
                }
                // Auto-restock when low
                if (runningStock < product.reorderPoint * weight && Math.random() < 0.6) {
                    const restockQty = Math.round(product.reorderQty * weight * rf(0.8, 1.2));
                    transactions.push({
                        type: 'purchase',
                        quantity: restockQty,
                        referenceDoc: `PO-RESTOCK-${ri(100000, 999999)}`,
                        performedBy: procOfficers[wi % procOfficers.length]._id,
                        notes: faker_1.faker.helpers.arrayElement(['Auto-replenishment restock', 'Scheduled reorder', 'Emergency stock refill']),
                        timestamp: new Date(date.getTime() + ri(10, 16) * 3600000),
                    });
                    runningStock += restockQty;
                }
                // Occasional inter-warehouse transfers
                if (day % 15 === 0 && wi < warehouses.length - 1 && Math.random() < 0.3) {
                    const transferQty = ri(5, Math.max(6, Math.round(runningStock * 0.05)));
                    if (transferQty < runningStock) {
                        transactions.push({
                            type: 'transfer_out',
                            quantity: transferQty,
                            referenceDoc: `TRF-${warehouse.code}-${warehouses[wi + 1].code}-${ri(1000, 9999)}`,
                            performedBy: whManagers[wi % whManagers.length]._id,
                            notes: `Transfer to ${warehouses[wi + 1].name}`,
                            timestamp: new Date(date.getTime() + 12 * 3600000),
                        });
                        runningStock -= transferQty;
                    }
                }
                // Rare returns
                if (Math.random() < 0.02) {
                    const returnQty = ri(1, 5);
                    transactions.push({
                        type: 'return',
                        quantity: returnQty,
                        performedBy: whManagers[wi % whManagers.length]._id,
                        notes: faker_1.faker.helpers.arrayElement(['Customer return — good condition', 'Excess return from order', 'Wrong item returned — reconditioned']),
                        timestamp: new Date(date.getTime() + ri(9, 17) * 3600000),
                    });
                    runningStock += returnQty;
                }
                // Rare damage
                if (Math.random() < 0.01 && runningStock > 3) {
                    const dmgQty = ri(1, 3);
                    transactions.push({
                        type: 'damage',
                        quantity: dmgQty,
                        performedBy: whManagers[wi % whManagers.length]._id,
                        notes: faker_1.faker.helpers.arrayElement(['Damaged during handling', 'Water damage', 'Forklift accident — write-off']),
                        timestamp: new Date(date.getTime() + ri(9, 17) * 3600000),
                    });
                    runningStock -= dmgQty;
                }
            }
            runningStock = Math.max(0, runningStock);
            const reservedStock = ri(0, Math.min(10, Math.floor(runningStock * 0.05)));
            const availableStock = Math.max(0, runningStock - reservedStock);
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
                lastReplenishmentAt: replenishmentTriggered ? daysAgo(ri(1, 5)) : undefined,
                transactions,
                zone: warehouse.zones?.[0]?.zoneCode,
            });
            totalTransactions += transactions.length;
        }
        process.stdout.write(`   [${pi + 1}/${products.length}] ${product.sku} — inventory done\n`);
    }
    return totalTransactions;
}
async function seedPurchaseOrders(suppliers, warehouses, products, procOfficers, adminUser) {
    const statusConfigs = [
        { status: 'draft', triggeredBy: 'manual' },
        { status: 'draft', triggeredBy: 'auto_replenishment' },
        { status: 'pending_approval', triggeredBy: 'auto_replenishment' },
        { status: 'pending_approval', triggeredBy: 'manual' },
        { status: 'approved', triggeredBy: 'manual' },
        { status: 'approved', triggeredBy: 'auto_replenishment' },
        { status: 'sent_to_supplier', triggeredBy: 'negotiation_agent' },
        { status: 'sent_to_supplier', triggeredBy: 'auto_replenishment' },
        { status: 'acknowledged', triggeredBy: 'auto_replenishment' },
        { status: 'acknowledged', triggeredBy: 'manual' },
        { status: 'partially_received', triggeredBy: 'manual' },
        { status: 'partially_received', triggeredBy: 'auto_replenishment' },
        { status: 'fully_received', triggeredBy: 'auto_replenishment' },
        { status: 'fully_received', triggeredBy: 'manual' },
        { status: 'fully_received', triggeredBy: 'negotiation_agent' },
        { status: 'cancelled', triggeredBy: 'manual' },
        { status: 'cancelled', triggeredBy: 'auto_replenishment' },
        { status: 'cancelled', triggeredBy: 'negotiation_agent' },
    ];
    const approvedStatuses = new Set([
        'approved', 'sent_to_supplier', 'acknowledged', 'partially_received', 'fully_received',
    ]); // draft / pending_approval / cancelled have no approvedBy
    const pos = [];
    for (let i = 0; i < 25; i++) {
        const config = statusConfigs[i % statusConfigs.length];
        const supplier = pick(suppliers);
        const warehouse = pick(warehouses);
        const numItems = ri(1, 4);
        const selectedProducts = faker_1.faker.helpers.shuffle([...products]).slice(0, numItems);
        const lineItems = selectedProducts.map((p) => {
            const qty = ri(Math.round(p.reorderQty * 0.5), Math.round(p.reorderQty * 1.5));
            const receivedQty = config.status === 'fully_received'
                ? qty
                : config.status === 'partially_received'
                    ? ri(Math.round(qty * 0.3), Math.round(qty * 0.7))
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
        const totalAmount = lineItems.reduce((s, li) => s + li.totalPrice, 0);
        const triggeredAt = daysAgo(ri(1, 45));
        const isApproved = approvedStatuses.has(config.status);
        pos.push({
            poNumber: `PO-${new Date().getFullYear().toString().slice(2)}${String(Date.now()).slice(-4)}${String(i).padStart(3, '0')}`,
            supplier: supplier._id,
            warehouse: warehouse._id,
            lineItems,
            totalAmount,
            currency: 'INR',
            status: config.status,
            triggeredBy: config.triggeredBy,
            triggeredAt,
            createdBy: pick(procOfficers)._id,
            approvedBy: isApproved ? adminUser._id : undefined,
            approvedAt: isApproved ? new Date(triggeredAt.getTime() + ri(3600000, 86400000)) : undefined,
            expectedDeliveryDate: daysFromNow(ri(3, 21)),
            notes: faker_1.faker.lorem.sentence(),
        });
    }
    return model_6.default.insertMany(pos);
}
async function seedNegotiationSessions(suppliers, products, procOfficers) {
    const statuses = ['in_progress', 'accepted', 'rejected', 'escalated', 'timed_out'];
    const initiatedByOptions = ['auto_replenishment', 'procurement_officer'];
    const sessions = [];
    for (let i = 0; i < 15; i++) {
        const supplier = pick(suppliers);
        const product = pick(products);
        const status = pick(statuses);
        const initiatedBy = pick(initiatedByOptions);
        const targetPrice = Math.round(product.unitPrice * rf(0.78, 0.90));
        const maxPrice = Math.round(product.unitPrice * rf(0.92, 0.99));
        const numRounds = ri(1, 4);
        const createdAt = daysAgo(ri(1, 30));
        const rounds = Array.from({ length: numRounds }, (_, r) => {
            const agentPrice = Math.round(targetPrice * rf(0.95, 1.05));
            const supplierPrice = Math.round(product.unitPrice * rf(0.88, 0.96));
            const roundStatus = r === numRounds - 1
                ? pick(['accepted', 'countered', 'rejected', 'pending'])
                : pick(['countered', 'accepted']);
            return {
                roundNumber: r + 1,
                agentOffer: {
                    unitPrice: agentPrice,
                    leadTimeDays: ri(product.leadTimeDays - 1, product.leadTimeDays + 2),
                    paymentTermsDays: ri(30, 60),
                    quantity: product.reorderQty,
                },
                supplierCounterOffer: roundStatus !== 'pending'
                    ? {
                        unitPrice: supplierPrice,
                        leadTimeDays: product.leadTimeDays,
                        paymentTermsDays: ri(30, 45),
                        quantity: product.reorderQty,
                    }
                    : undefined,
                agentReasoning: faker_1.faker.lorem.sentences(2),
                status: roundStatus,
                timestamp: new Date(createdAt.getTime() + r * 3600000 * ri(1, 6)),
            };
        });
        const isCompleted = ['accepted', 'rejected', 'timed_out'].includes(status);
        const finalPrice = Math.round(product.unitPrice * rf(0.85, 0.95));
        sessions.push({
            supplier: supplier._id,
            product: product._id,
            initiatedBy,
            initiatedByUser: initiatedBy === 'procurement_officer' ? pick(procOfficers)._id : undefined,
            status,
            rounds,
            agentConstraints: {
                maxUnitPrice: maxPrice,
                targetUnitPrice: targetPrice,
                maxLeadTimeDays: product.leadTimeDays + ri(2, 5),
                requiredQty: product.reorderQty,
            },
            finalTerms: status === 'accepted'
                ? {
                    unitPrice: finalPrice,
                    leadTimeDays: product.leadTimeDays,
                    paymentTermsDays: ri(30, 60),
                    moq: Math.round(product.reorderQty * 0.25),
                    savingsPercent: rf(3, 15),
                }
                : undefined,
            deadline: isCompleted ? daysAgo(ri(1, 5)) : daysFromNow(ri(1, 2)),
            completedAt: isCompleted ? daysAgo(ri(0, 3)) : undefined,
            langGraphRunId: faker_1.faker.string.uuid(),
            langGraphState: { step: numRounds, phase: status },
        });
    }
    return model_7.default.insertMany(sessions);
}
async function seedDemandForecasts(products, warehouses) {
    const forecasts = [];
    const modelVersions = ['arima-v1', 'prophet-v2', 'gemini-v1'];
    // Generate forecasts for first 10 products across all warehouses
    for (const product of products.slice(0, 10)) {
        for (const warehouse of warehouses) {
            const forecastedAt = daysAgo(ri(0, 7));
            const baseDemand = ri(5, 50);
            const dailyForecasts = Array.from({ length: 7 }, (_, d) => {
                const predicted = Math.max(1, Math.round(baseDemand * rf(0.7, 1.3)));
                const variance = Math.round(predicted * rf(0.1, 0.25));
                const actual = d < 3 ? Math.max(0, Math.round(predicted * rf(0.8, 1.2))) : undefined;
                const mape = actual !== undefined ? Math.min(99, rf(2, 25)) : undefined;
                return {
                    date: daysFromNow(d + 1),
                    predictedDemand: predicted,
                    confidenceLow: Math.max(0, predicted - variance),
                    confidenceHigh: predicted + variance,
                    actualDemand: actual,
                    mape,
                };
            });
            const totalPredicted = dailyForecasts.reduce((s, f) => s + f.predictedDemand, 0);
            forecasts.push({
                product: product._id,
                warehouse: warehouse._id,
                forecastedAt,
                forecastHorizonDays: 7,
                dailyForecasts,
                totalPredicted7Day: totalPredicted,
                overallMape: rf(3, 20),
                modelVersion: pick(modelVersions),
                recommendedReorderQty: Math.round(totalPredicted * rf(1.1, 1.4)),
                recommendedOrderDate: daysFromNow(ri(1, product.leadTimeDays + 2)),
            });
        }
    }
    return model_8.default.insertMany(forecasts);
}
async function seedBlockchainLogs(purchaseOrders, adminUser) {
    const network = 'ethereum-testnet';
    const logs = [];
    const eventSequence = [
        'po_created', 'po_approved', 'po_sent', 'po_received',
    ];
    const eligiblePOs = purchaseOrders.filter((po) => ['approved', 'sent_to_supplier', 'acknowledged', 'partially_received', 'fully_received'].includes(po.status));
    for (const po of eligiblePOs.slice(0, 20)) {
        const eventsForPO = po.status === 'fully_received'
            ? eventSequence
            : po.status === 'partially_received'
                ? eventSequence.slice(0, 3)
                : po.status === 'sent_to_supplier' || po.status === 'acknowledged'
                    ? eventSequence.slice(0, 3)
                    : eventSequence.slice(0, 2);
        for (const eventType of eventsForPO) {
            const isConfirmed = Math.random() > 0.1;
            const confirmedAt = isConfirmed ? faker_1.faker.date.recent({ days: 5 }) : undefined;
            logs.push({
                eventType,
                referenceModel: 'PurchaseOrder',
                referenceId: po._id,
                payload: {
                    poNumber: po.poNumber,
                    supplierId: po.supplier,
                    warehouseId: po.warehouse,
                    totalAmount: po.totalAmount,
                    currency: po.currency,
                    eventType,
                    timestamp: new Date().toISOString(),
                },
                txHash: generateTxHash(),
                blockNumber: ri(18000000, 19500000),
                networkName: network,
                confirmedAt,
                confirmationStatus: isConfirmed ? 'confirmed' : 'pending',
                triggeredBy: adminUser._id,
            });
        }
    }
    return model_9.default.insertMany(logs);
}
async function seedNotifications(allUsers, purchaseOrders, warehouses) {
    const channels = ['in_app', 'email', 'both'];
    const notifications = [];
    const notifTemplates = [
        {
            type: 'low_stock_alert',
            title: 'Low Stock Alert',
            message: (p) => `Stock for ${p} has fallen below the reorder point. Immediate replenishment recommended.`,
            relatedModel: 'Product',
        },
        {
            type: 'reorder_triggered',
            title: 'Auto-Replenishment Triggered',
            message: (p) => `An automatic purchase order has been created for ${p} due to low inventory levels.`,
            relatedModel: 'Inventory',
        },
        {
            type: 'po_created',
            title: 'New Purchase Order Created',
            message: (p) => `Purchase order ${p} has been created and is pending approval.`,
            relatedModel: 'PurchaseOrder',
        },
        {
            type: 'po_approved',
            title: 'Purchase Order Approved',
            message: (p) => `Purchase order ${p} has been approved and will be sent to the supplier.`,
            relatedModel: 'PurchaseOrder',
        },
        {
            type: 'po_received',
            title: 'Purchase Order Received',
            message: (p) => `Goods for purchase order ${p} have been received at the warehouse.`,
            relatedModel: 'PurchaseOrder',
        },
        {
            type: 'warehouse_capacity_alert',
            title: 'Warehouse Capacity Warning',
            message: (p) => `${p} has exceeded 80% storage capacity. Consider redistribution.`,
            relatedModel: 'Warehouse',
        },
        {
            type: 'forecast_ready',
            title: 'Demand Forecast Generated',
            message: (p) => `7-day demand forecast for ${p} is ready for review.`,
            relatedModel: 'DemandForecast',
        },
        {
            type: 'negotiation_completed',
            title: 'Negotiation Completed',
            message: (p) => `Price negotiation for ${p} has been successfully completed.`,
            relatedModel: 'NegotiationSession',
        },
        {
            type: 'blockchain_confirmed',
            title: 'Blockchain Transaction Confirmed',
            message: (p) => `Supply chain event for ${p} has been confirmed on the blockchain.`,
            relatedModel: 'PurchaseOrder',
        },
        {
            type: 'system_alert',
            title: 'System Maintenance Scheduled',
            message: (_) => 'The system will undergo scheduled maintenance this Sunday from 2:00 AM to 4:00 AM IST.',
            relatedModel: undefined,
        },
    ];
    for (let i = 0; i < 40; i++) {
        const recipient = pick(allUsers);
        const template = pick(notifTemplates);
        const po = pick(purchaseOrders);
        const warehouse = pick(warehouses);
        const label = template.relatedModel === 'PurchaseOrder' ? po.poNumber : warehouse.name;
        const isRead = Math.random() > 0.45;
        const createdAt = faker_1.faker.date.recent({ days: 14 });
        notifications.push({
            recipient: recipient._id,
            type: template.type,
            title: template.title,
            message: template.message(label),
            relatedModel: template.relatedModel,
            relatedId: template.relatedModel === 'PurchaseOrder'
                ? po._id
                : template.relatedModel === 'Warehouse'
                    ? warehouse._id
                    : undefined,
            channel: pick(channels),
            isRead,
            readAt: isRead ? new Date(createdAt.getTime() + ri(60000, 3600000 * 12)) : undefined,
            emailSent: Math.random() > 0.2,
            emailSentAt: Math.random() > 0.2 ? new Date(createdAt.getTime() + ri(5000, 60000)) : undefined,
            createdAt,
            updatedAt: createdAt,
        });
    }
    return model_10.default.insertMany(notifications);
}
async function seedWarehouseOptimizationRecommendations(warehouses, products, adminUser) {
    const statuses = ['pending', 'accepted', 'partially_accepted', 'rejected'];
    const summaryTemplates = [
        'Analysis indicates significant stock imbalance between Mumbai and Bangalore hubs. Redistribution of fast-moving SKUs recommended to reduce average pick time by an estimated 18%. High-velocity items should be relocated from bulk storage to fast-moving zones.',
        'Warehouse utilization is critically uneven: Kolkata hub at 85% capacity while Bangalore hub is at 40%. Transfer of slow-moving paper products to Bangalore will improve overall logistics efficiency and reduce storage costs by approximately 12%.',
        'Zone type misallocation detected. Fragile items are stored in bulk zones causing damage rates of 2.1%. Recommended reallocation to dedicated fragile zones across Delhi and Chennai hubs will reduce damage incidents and insurance costs.',
        'Seasonal demand patterns suggest pre-positioning of writing instruments in South hubs ahead of back-to-school season. Early transfers will prevent stockouts and reduce emergency replenishment freight costs.',
        'Cross-docking opportunity identified for office supplies between Mumbai and Pune warehouses. Direct supplier delivery to Pune instead of routing through Mumbai will cut lead time by 2 days and reduce handling costs.',
    ];
    const recommendations = [];
    for (let i = 0; i < 6; i++) {
        const analysedCount = ri(2, warehouses.length);
        const analysedWarehouses = faker_1.faker.helpers.shuffle([...warehouses]).slice(0, analysedCount);
        const status = pick(statuses);
        const isReviewed = status !== 'pending';
        const generatedAt = daysAgo(ri(1, 14));
        const transferRecs = Array.from({ length: ri(2, 5) }, () => {
            const fromWH = pick(analysedWarehouses);
            const toWH = warehouses.find((w) => w._id.toString() !== fromWH._id.toString()) || warehouses[0];
            return {
                product: pick(products)._id,
                fromWarehouse: fromWH._id,
                toWarehouse: toWH._id,
                quantity: ri(20, 300),
                reason: faker_1.faker.helpers.arrayElement([
                    'Overstocked at source warehouse — redistribution reduces holding cost',
                    'Destination warehouse below safety stock threshold for this SKU',
                    'Demand pattern shift — faster-moving hub needs more inventory',
                    'Approaching warehouse capacity limit at source location',
                    'Seasonal demand increase expected at destination city',
                ]),
                estimatedCostSaving: ri(5000, 80000),
            };
        });
        recommendations.push({
            generatedAt,
            generationDurationSeconds: ri(15, 120),
            warehousesAnalysed: analysedWarehouses.map((w) => w._id),
            transferRecommendations: transferRecs,
            reallocationSummary: summaryTemplates[i % summaryTemplates.length],
            predictedLogisticsCostReductionPercent: rf(5, 22),
            predictedCapacityUtilizationImprovement: rf(8, 30),
            status,
            reviewedBy: isReviewed ? adminUser._id : undefined,
            reviewedAt: isReviewed ? new Date(generatedAt.getTime() + ri(3600000, 86400000 * 3)) : undefined,
            reviewNotes: isReviewed ? faker_1.faker.lorem.sentence() : undefined,
            langGraphRunId: faker_1.faker.string.uuid(),
            agentVersion: pick(['v1.0', 'v1.1', 'v1.2']),
        });
    }
    return model_11.default.insertMany(recommendations);
}
// ─── Main Seed Orchestration ─────────────────────────────────────────────────
async function seed() {
    console.log('\n🌱  StationeryChain — Data Seed (Faker)');
    console.log('═══════════════════════════════════════════════');
    console.log(`   MongoDB : ${MONGODB_URI.slice(0, 40)}...`);
    console.log(`   Clean   : ${SHOULD_CLEAN}`);
    console.log(`   History : ${HISTORY_DAYS} days of inventory transactions\n`);
    await mongoose_1.default.connect(MONGODB_URI);
    console.log('✅  Connected to MongoDB\n');
    // ── Clean ──────────────────────────────────────────────────────────────
    if (SHOULD_CLEAN) {
        console.log('🧹  Cleaning existing data...');
        await Promise.all([
            model_1.default.deleteMany({}),
            model_2.default.deleteMany({}),
            model_3.default.deleteMany({}),
            model_4.default.deleteMany({}),
            model_5.default.deleteMany({}),
            model_6.default.deleteMany({}),
            model_7.default.deleteMany({}),
            model_8.default.deleteMany({}),
            model_9.default.deleteMany({}),
            model_10.default.deleteMany({}),
            model_11.default.deleteMany({}),
        ]);
        console.log('   Done.\n');
    }
    const passwordHash = await bcryptjs_1.default.hash('Password123!', 10);
    // ── 1. Suppliers (first, so we can link supplier users) ──────────────────
    console.log('🏢  Seeding suppliers...');
    const suppliers = await seedSuppliers();
    console.log(`    Created ${suppliers.length} suppliers\n`);
    // ── 2. Users ───────────────────────────────────────────────────────────
    console.log('👤  Seeding users...');
    const users = await seedUsers(passwordHash, suppliers);
    const adminUser = users.find((u) => u.role === 'admin');
    const whManagers = users.filter((u) => u.role === 'warehouse_manager');
    const procOfficers = users.filter((u) => u.role === 'procurement_officer');
    const supplierUsers = users.filter((u) => u.role === 'supplier');
    console.log(`    Created ${users.length} users (1 admin, ${whManagers.length} wh managers, ${procOfficers.length} proc officers, ${supplierUsers.length} suppliers)\n`);
    // ── 3. Warehouses ──────────────────────────────────────────────────────
    console.log('🏭  Seeding warehouses...');
    const warehouses = await seedWarehouses(whManagers);
    for (let i = 0; i < whManagers.length; i++) {
        const assigned = warehouses.filter((_, idx) => idx % whManagers.length === i).map((w) => w._id);
        await model_1.default.findByIdAndUpdate(whManagers[i]._id, { assignedWarehouses: assigned });
    }
    console.log(`    Created ${warehouses.length} warehouses\n`);
    // ── 4. Products ────────────────────────────────────────────────────────
    console.log('📦  Seeding products...');
    const products = await seedProducts(suppliers, adminUser);
    console.log(`    Created ${products.length} products + updated supplier catalogs\n`);
    // ── 5. Inventory (heavy — 90-day transaction history) ──────────────────
    console.log('📊  Seeding inventory with 90-day transaction history...');
    const totalTx = await seedInventory(products, warehouses, whManagers, procOfficers);
    console.log(`    Created ${products.length * warehouses.length} inventory records`);
    console.log(`    Generated ${totalTx.toLocaleString()} total transactions\n`);
    // ── 6. Purchase Orders ─────────────────────────────────────────────────
    console.log('📝  Seeding purchase orders...');
    const purchaseOrders = await seedPurchaseOrders(suppliers, warehouses, products, procOfficers, adminUser);
    console.log(`    Created ${purchaseOrders.length} purchase orders\n`);
    // ── 7. Negotiation Sessions ────────────────────────────────────────────
    console.log('🤝  Seeding negotiation sessions...');
    const negotiations = await seedNegotiationSessions(suppliers, products, procOfficers);
    console.log(`    Created ${negotiations.length} negotiation sessions\n`);
    // ── 8. Demand Forecasts ────────────────────────────────────────────────
    console.log('📈  Seeding demand forecasts...');
    const forecasts = await seedDemandForecasts(products, warehouses);
    console.log(`    Created ${forecasts.length} demand forecasts\n`);
    // ── 9. Blockchain Logs ─────────────────────────────────────────────────
    console.log('⛓️   Seeding blockchain logs...');
    const blockchainLogs = await seedBlockchainLogs(purchaseOrders, adminUser);
    console.log(`    Created ${blockchainLogs.length} blockchain event logs\n`);
    // ── 10. Notifications ──────────────────────────────────────────────────
    console.log('🔔  Seeding notifications...');
    const notifications = await seedNotifications(users, purchaseOrders, warehouses);
    console.log(`    Created ${notifications.length} notifications\n`);
    // ── 11. Warehouse Optimization Recommendations ─────────────────────────
    console.log('🏗️   Seeding warehouse optimization recommendations...');
    const optRecs = await seedWarehouseOptimizationRecommendations(warehouses, products, adminUser);
    console.log(`    Created ${optRecs.length} optimization recommendations\n`);
    // ── Summary ────────────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════');
    console.log('  SEED COMPLETE — Summary');
    console.log('═══════════════════════════════════════════════');
    console.log(`  Users                        : ${users.length}`);
    console.log(`  Warehouses                   : ${warehouses.length}`);
    console.log(`  Suppliers                    : ${suppliers.length}`);
    console.log(`  Products                     : ${products.length}`);
    console.log(`  Inventory Records            : ${products.length * warehouses.length}`);
    console.log(`  Inventory Transactions       : ${totalTx.toLocaleString()}`);
    console.log(`  Purchase Orders              : ${purchaseOrders.length}`);
    console.log(`  Negotiation Sessions         : ${negotiations.length}`);
    console.log(`  Demand Forecasts             : ${forecasts.length}`);
    console.log(`  Blockchain Logs              : ${blockchainLogs.length}`);
    console.log(`  Notifications                : ${notifications.length}`);
    console.log(`  Optimization Recommendations : ${optRecs.length}`);
    console.log('═══════════════════════════════════════════════');
    console.log('\n  Login: admin@scm.dev / Password123!');
    console.log('  All other users also use: Password123!\n');
    await mongoose_1.default.disconnect();
    console.log('✅  Disconnected from MongoDB. Done!\n');
}
seed().catch((err) => {
    console.error('\n❌  Seed failed:', err);
    mongoose_1.default.disconnect();
    process.exit(1);
});
