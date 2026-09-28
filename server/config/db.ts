import mongoose from 'mongoose';

// Register models before query execution
import '../models/index.ts';

/**
 * Strips accidental wrapping quotes (single or double) and trims whitespace.
 */
export function cleanMongoUri(rawUri: string): string {
  let cleaned = rawUri.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

/**
 * Extracts and validates the explicit database name from MONGODB_URI.
 * Dynamically supports any database path (e.g. adviora_prod, adviora_test, or staging).
 */
export function getDatabaseNameFromUri(rawUri: string): string {
  const uri = cleanMongoUri(rawUri);
  const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
  if (!match || !match[1] || match[1].trim().length === 0) {
    throw new Error('MONGODB_URI must specify an explicit database path (e.g. mongodb+srv://.../<dbname>?...)');
  }
  return match[1].trim();
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

/**
 * Connects to MongoDB in read-only mode with bounded connection timeouts.
 */
async function connectToDatabase() {
  const rawUri = process.env.MONGODB_URI || process.env.MONGODB_URL;
  if (!rawUri || rawUri.trim().length === 0) {
    throw new Error('MONGODB_URI environment variable is missing');
  }

  const uri = cleanMongoUri(rawUri);
  getDatabaseNameFromUri(uri);

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      autoIndex: false,
      autoCreate: false,
    };

    cached.promise = mongoose.connect(uri, opts).catch((err) => {
      // Clear rejected promise so subsequent requests can recover
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default connectToDatabase;
