import { MongoMemoryServer } from "mongodb-memory-server";
import fs from "node:fs";

const mongod = await MongoMemoryServer.create({
  instance: { port: 27117, dbName: "dialboard" },
});

const uri = mongod.getUri();
console.log("Local dev MongoDB running at:", uri);
fs.writeFileSync(".dev-mongo-uri.txt", uri);

process.on("SIGINT", async () => {
  await mongod.stop();
  process.exit(0);
});
