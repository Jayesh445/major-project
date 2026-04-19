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
const mongoose_1 = __importStar(require("mongoose"));
/**
 * Catalog product subdocument schema
 */
const CatalogProductSchema = new mongoose_1.Schema({
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product reference is required'],
    },
    unitPrice: {
        type: Number,
        required: [true, 'Unit price is required'],
        min: [0, 'Unit price cannot be negative'],
    },
    leadTimeDays: {
        type: Number,
        required: [true, 'Lead time is required'],
        min: [0, 'Lead time cannot be negative'],
    },
    moq: {
        type: Number,
        required: [true, 'Minimum order quantity (MOQ) is required'],
        min: [1, 'MOQ must be at least 1'],
    },
}, { _id: true });
/**
 * Contract terms subdocument schema
 */
const ContractTermsSchema = new mongoose_1.Schema({
    paymentTermsDays: {
        type: Number,
        required: [true, 'Payment terms are required'],
        min: [0, 'Payment terms cannot be negative'],
    },
    deliveryTerms: {
        type: String,
        required: [true, 'Delivery terms are required'],
        trim: true,
    },
    returnPolicy: {
        type: String,
        required: [true, 'Return policy is required'],
        trim: true,
    },
    validUntil: {
        type: Date,
    },
}, { _id: false });
/**
 * Negotiation statistics subdocument schema
 */
const NegotiationStatsSchema = new mongoose_1.Schema({
    totalNegotiations: {
        type: Number,
        default: 0,
        min: [0, 'Total negotiations cannot be negative'],
    },
    acceptedOffers: {
        type: Number,
        default: 0,
        min: [0, 'Accepted offers cannot be negative'],
    },
    averageSavingsPercent: {
        type: Number,
        default: 0,
        min: [0, 'Average savings cannot be negative'],
        max: [100, 'Average savings cannot exceed 100%'],
    },
}, { _id: false });
/**
 * Supplier schema definition
 */
const SupplierSchema = new mongoose_1.Schema({
    companyName: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        minlength: [2, 'Company name must be at least 2 characters long'],
        maxlength: [200, 'Company name cannot exceed 200 characters'],
    },
    contactEmail: {
        type: String,
        required: [true, 'Contact email is required'],
        lowercase: true,
        trim: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            'Please provide a valid email address',
        ],
    },
    contactPhone: {
        type: String,
        required: [true, 'Contact phone is required'],
        trim: true,
        match: [
            /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
            'Please provide a valid phone number',
        ],
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
    },
    catalogProducts: {
        type: [CatalogProductSchema],
        default: [],
    },
    currentContractTerms: {
        type: ContractTermsSchema,
    },
    rating: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be less than 0'],
        max: [5, 'Rating cannot exceed 5'],
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
    negotiationStats: {
        type: NegotiationStatsSchema,
        default: () => ({
            totalNegotiations: 0,
            acceptedOffers: 0,
            averageSavingsPercent: 0,
        }),
    },
}, {
    timestamps: true,
});
// Indexes
SupplierSchema.index({ companyName: 1 });
SupplierSchema.index({ contactEmail: 1 });
SupplierSchema.index({ isApproved: 1 });
SupplierSchema.index({ rating: -1 }); // Descending order for highest ratings first
// Compound index for catalog products
SupplierSchema.index({ 'catalogProducts.product': 1 });
/**
 * Supplier model
 */
const Supplier = mongoose_1.default.model('Supplier', SupplierSchema);
exports.default = Supplier;
