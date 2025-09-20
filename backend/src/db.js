import mongoose from 'mongoose';
import { createClient } from 'redis';
import Log from 'logger';
import {LEVELS,STACKS,BOTH_PACKAGES,BACKEND_PACKAGES} from "logger/constant.js"

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://abishek7766:Ki1wxzGFhbE5YcI8@cluster0.vmfi6af.mongodb.net/url-shortener');
    Log(STACKS.BACKEND, LEVELS.INFO, BACKEND_PACKAGES.DATABASE, 'MongoDB connected');
  } catch (error) {
    Log(STACKS.BACKEND, LEVELS.ERROR, BACKEND_PACKAGES.DATABASE, `MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export const redisClient = createClient(process.env.REDIS_URI || "rediss://default:AVNS_Gr1rW3yCUFbHxxZhUJi@redis-abishek7766-a16d.h.aivencloud.com:27843");

redisClient.on('error', (err) => Log(STACKS.BACKEND, LEVELS.ERROR, BACKEND_PACKAGES.DATABASE, `Redis Client Error: ${err.message}`));

await redisClient.connect();
Log(STACKS.BACKEND, LEVELS.INFO, BACKEND_PACKAGES.DATABASE, 'Redis connected');