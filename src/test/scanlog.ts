import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
// import { parseTx } from "./decode-transaction";
import { promises as fs } from "fs";

// const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
const connection = new Connection('https://pyth-network.rpcpool.com/6a1b2b5a676f51788083f73826f4');
const filePath = "../../logs/liquidity_logs.json";

ensureFileExists(filePath);

// Ensure the file exists
async function ensureFileExists(path: string) {
  try {
    await fs.access(path);
  } catch {
    await fs.writeFile(path, "[]", "utf-8");
  }
}

connection.onLogs(
  new PublicKey("LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo"), // Meteora program
  async (logInfo) => {
    // console.log("logInfo------------------", logInfo);
    const { logs, signature } = logInfo;
    if (logs.some((l) => l.includes("AddLiquidity"))) {
      console.log("Liquidity Added!", signature);
      await writeToFile("Add", signature);
      // await parseTx(signature);
    }
    if (logs.some((l) => l.includes("RemoveLiquidity"))) {
      console.log("Liquidity Removed!", signature);
      await writeToFile("Remove", signature);
      // await parseTx(signature);
    }
  },
  "confirmed"
);

async function writeToFile(type: string, signature: string) {
  const data = await fs.readFile(filePath, "utf-8");
  const jsonData = JSON.parse(data);

  jsonData.push({ type, txId: signature });

  await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), "utf-8");
}
