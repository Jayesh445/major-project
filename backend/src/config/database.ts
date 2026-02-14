import mongoose from 'mongoose';

interface ConnectionOptions {
  maxPoolSize?: number;
  minPoolSize?: number;
  socketTimeoutMS?: number;
  serverSelectionTimeoutMS?: number;
}

/**
 * Database connection utility for MongoDB using Mongoose
 */
class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance of Database
   */
  public static getInstance(): Database {
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
  public async connect(
    uri?: string,
    options: ConnectionOptions = {}
  ): Promise<void> {
    if (this.isConnected) {
      console.log('📦 MongoDB: Already connected');
      return;
    }

    const mongoUri = uri || process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error(
        'MONGODB_URI is not defined in environment variables or passed as parameter'
      );
    }

    try {
      const defaultOptions: ConnectionOptions = {
        maxPoolSize: 10,
        minPoolSize: 5,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
      };

      const connectionOptions = { ...defaultOptions, ...options };

      await mongoose.connect(mongoUri, connectionOptions);

      this.isConnected = true;

      console.log('✅ MongoDB: Connection established successfully');
      console.log(`📍 MongoDB: Connected to ${mongoose.connection.name} database`);

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB: Connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB: Disconnected from database');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
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
    } catch (error) {
      console.error('❌ MongoDB: Connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      console.log('📦 MongoDB: Already disconnected');
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('👋 MongoDB: Disconnected successfully');
    } catch (error) {
      console.error('❌ MongoDB: Error during disconnection:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get Mongoose connection instance
   */
  public getConnection(): mongoose.Connection {
    return mongoose.connection;
  }
}

// Export singleton instance
export const database = Database.getInstance();

// Export class for testing purposes
export { Database };
