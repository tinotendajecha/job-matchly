// data/jobs/matchRun.ts — `npm run jobs:match`
import 'dotenv/config';
import { rebuildMatches } from '@/lib/jobs/match';

async function main() {
  console.log('Rebuilding job matches...');
  const r = await rebuildMatches();
  console.log(`\n${r.matches} matches for ${r.users} users, scored across ${r.bracketsComputed} bracket groups (0 AI calls).`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => process.exit());
