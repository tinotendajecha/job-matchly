// data/jobs/tagRun.ts — `npm run jobs:tag`
import 'dotenv/config';
import { tagUsers } from './tagUsers';

async function main() {
  const noAi = process.argv.includes('--no-ai');
  console.log(`Tagging users${noAi ? ' (rules only)' : ''}...`);
  const r = await tagUsers({ useAiFallback: !noAi });
  console.log(`\nTagged ${r.tagged} — ${r.byRules} by rules, ${r.byAi} by AI. Skipped ${r.skipped}.`);
  // Rough spend check: gpt-5-mini input is ~$0.25/1M tokens, ~4 chars/token.
  const inputTokens = Math.round(r.aiInputChars / 4);
  console.log(`AI input ≈ ${inputTokens} tokens (~$${((inputTokens / 1e6) * 0.25).toFixed(4)} in, plus a little output).`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => process.exit());
