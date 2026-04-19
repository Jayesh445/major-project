"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = exports.database = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Database connection utility for MongoDB using Mongoose
 */
class Database {
    constructor() {
        this.isConnected = false;
    }
    /**
     * Get singleton instance of Database
     */
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    /**
     * Connect to MongoDB
     * @param uri - MongoDB connection URI (defaults to MONGODB_URI env variable)
     * @param options - Additional connection options
     */
    async connect(uri, options = {}) {
        if (this.isConnected) {
            console.log('📦 MongoDB: Already connected');
            return;
        }
        const mongoUri = uri || process.env.MONGODB_URI;
        console.log(mongoUri);
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in environment variables or passed as parameter');
        }
        try {
            const defaultOptions = {
                maxPoolSize: 10,
                minPoolSize: 5,
                socketTimeoutMS: 45000,
                serverSelectionTimeoutMS: 5000,
            };
            const connectionOptions = { ...defaultOptions, ...options };
            await mongoose_1.default.connect(mongoUri, connectionOptions);
            this.isConnected = true;
            console.log('✅ MongoDB: Connection established successfully');
            console.log(`📍 MongoDB: Connected to ${mongoose_1.default.connection.name} database`);
            // Handle connection events
            mongoose_1.default.connection.on('error', (error) => {
                console.error('❌ MongoDB: Connection error:', error);
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('disconnected', () => {
                console.warn('⚠️  MongoDB: Disconnected from database');
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('reconnected', () => {
                console.log('🔄 MongoDB: Reconnected to database');
                this.isConnected = true;
            });
            // Handle application termination
            process.on('SIGINT', async () => {
                await this.disconnect();
                process.exit(0);
            });
            process.on('SIGTERM', async () => {
                await this.disconnect();
                process.exit(0);
            });
        }
        catch (error) {
            console.error('❌ MongoDB: Connection failed:', error);
            this.isConnected = false;
            throw error;
        }
    }
    /**
     * Disconnect from MongoDB
     */
    async disconnect() {
        if (!this.isConnected) {
            console.log('📦 MongoDB: Already disconnected');
            return;
        }
        try {
            await mongoose_1.default.disconnect();
            this.isConnected = false;
            console.log('👋 MongoDB: Disconnected successfully');
        }
        catch (error) {
            console.error('❌ MongoDB: Error during disconnection:', error);
            throw error;
        }
    }
    /**
     * Get connection status
     */
    getConnectionStatus() {
        return this.isConnected;
    }
    /**
     * Get Mongoose connection instance
     */
    getConnection() {
        return mongoose_1.default.connection;
    }
}
exports.Database = Database;
// Export singleton instance
exports.database = Database.getInstance();
