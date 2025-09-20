import mongoose from 'mongoose';
import { createClient } from 'redis';
import Log from 'logger';
import {LEVELS,STACKS,BOTH_PACKAGES,BACKEND_PACKAGES} from "logger/constant.js"
import  dotenv  from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI );
    Log(STACKS.BACKEND, LEVELS.INFO, BACKEND_PACKAGES.DB, 'MongoDB connected');
  } catch (error) {
    Log(STACKS.BACKEND, LEVELS.ERROR, BACKEND_PACKAGES.DB, `MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export const redisClient = createClient({
  url: process.env.REDIS_URI
} );

redisClient.on('error', (err) => Log(STACKS.BACKEND, LEVELS.ERROR, BACKEND_PACKAGES.DB, `Redis Client Error: ${err.message}`));

await redisClient.connect();
Log(STACKS.BACKEND, LEVELS.INFO, BACKEND_PACKAGES.DB, 'Redis connected');