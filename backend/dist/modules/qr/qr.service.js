"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateForPurchaseOrder = generateForPurchaseOrder;
exports.generatePngBuffer = generatePngBuffer;
const QRCode = __importStar(require("qrcode"));
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
/**
 * Generate a QR code that links to the public verification page for a PurchaseOrder.
 * The QR encodes a URL like: https://app.autostock.ai/verify/<poId>?type=po_created
 */
async function generateForPurchaseOrder(poId, eventType = 'po_created') {
    const verifyUrl = `${PUBLIC_BASE_URL}/verify/${poId}?type=${eventType}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 320,
        color: {
            dark: '#000000',
            light: '#FFFFFF',
        },
    });
    return { qrDataUrl, verifyUrl, referenceId: poId };
}
/**
 * Generate a raw PNG buffer (for printing on shipping labels).
 */
async function generatePngBuffer(poId, eventType = 'po_created') {
    const verifyUrl = `${PUBLIC_BASE_URL}/verify/${poId}?type=${eventType}`;
    return QRCode.toBuffer(verifyUrl, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 512,
    });
}
