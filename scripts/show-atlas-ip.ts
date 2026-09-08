/**
 * Prints your public IP and Atlas Network Access steps.
 * Run: npm run db:ip
 */
async function getPublicIp(): Promise<string> {
  const endpoints = ["https://api.ipify.org?format=text", "https://ifconfig.me/ip"];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) continue;
      const ip = (await response.text()).trim();
      if (ip) return ip;
    } catch {
      // try next endpoint
    }
  }

  return "unknown";
}

async function main() {
  const ip = await getPublicIp();

  console.log("\nMongoDB Atlas — allow this machine to connect\n");
  console.log(`  Your public IP: ${ip}\n`);
  console.log("  1. Open https://cloud.mongodb.com/");
  console.log("  2. Select your project → Network Access → Add IP Address");
  console.log(`  3. Add: ${ip}  (or use "Allow Access from Anywhere" for dev: 0.0.0.0/0)`);
  console.log("  4. Wait ~1 minute, then run: npm run db:check\n");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

