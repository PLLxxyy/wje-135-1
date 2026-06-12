import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "./config/database.config";

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});
