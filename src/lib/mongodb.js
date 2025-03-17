// lib/mongodb.js
import { MongoClient } from 'mongodb';
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}
if (!MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable');
}

let cachedClient = global.mongoose;
let cachedDb = global.db;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
  const db = client.db(MONGODB_DB);
  cachedClient = client;
  cachedDb = db;

  global.mongoose = cachedClient;
  global.db = cachedDb;

  return { client, db };
}

export default connectToDatabase;
