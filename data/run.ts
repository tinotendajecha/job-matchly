// data/run.ts
// CLI entrypoint: `npm run data:ingest`

import "dotenv/config";
import { runPipeline } from "./pipeline";

async function main() {
  console.log("Starting briefing ingest pipeline...");
  const result = await runPipeline("MANUAL");
  console.log(`\nDone. Saved ${result.saved}, skipped ${result.skipped}, errors ${result.errors}.`);
}

main()
  .catch((e) => {
    console.error("Pipeline failed:", e);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
