import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function run() {
  await mongoose.connect(uri!);
  const TableSessions = mongoose.model('TableSession', new mongoose.Schema({}, { strict: false }));
  const Orders = mongoose.model('orders', new mongoose.Schema({}, { strict: false }));
  
  const sessions = await TableSessions.find({}).lean();
  console.log("Sessions count:", sessions.length);
  sessions.forEach(s => console.log(s.tableName || s.table, s.sessionId, s.startTime, s.endTime));

  const orders = await Orders.find({}).lean();
  console.log("Orders count:", orders.length);
  orders.forEach(o => console.log(o.tableName || o.table, o.sessionId, o.orderTotal, o.state));

  process.exit();
}
run();
