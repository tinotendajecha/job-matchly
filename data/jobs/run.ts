// data/jobs/run.ts
// CLI entrypoint: `npm run jobs:ingest`
import 'dotenv/config';
import { runJobsPipeline } from './pipeline';

async function main() {
  console.log('Starting job ingest...');
  const result = await runJobsPipeline('MANUAL');
  console.log(
    `\nDone. Saved ${result.saved}, skipped ${result.skipped}, expired ${result.expired}, errors ${result.errors}.`
  );
}

main()
  .catch((e) => {
    console.error('Job ingest failed:', e);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
