#!/usr/bin/env tsx
/**
 * Fetches Wikipedia curiosities for all streets used in the quiz plan.
 * Run with: npx tsx scripts/fetchCuriosities.ts
 *
 * Uses the Wikipedia batch API (up to 50 titles per request) to minimize HTTP calls.
 * Falls back to search API for streets without an exact Wikipedia article match.
 * Results saved incrementally to public/streetCuriosities.json.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Street {
  id: string;
  name: string;
}

interface QuizQuestion {
  correctId: string;
}

interface QuizDay {
  questions: QuizQuestion[];
}

interface QuizPlan {
  quizzes: QuizDay[];
}

interface Curiosity {
  ca?: string;
  es?: string;
  en?: string;
}

type Curiosities = Record<string, Curiosity>;

const LANGS = ['ca', 'es', 'en'] as const;
const BATCH_SIZE = 40;
const DELAY_MS = 1000;
const MAX_CHARS = 280;
const OUT_PATH = join(process.cwd(), 'public/streetCuriosities.json');

// Common street prefixes to strip when searching Wikipedia (improve match quality)
const STRIP_PREFIXES = [
  'carrer de ',
  'carrer del ',
  "carrer de l'",
  'avinguda de ',
  'avinguda del ',
  "avinguda de l'",
  'passeig de ',
  'passeig del ',
  "passeig de l'",
  'plaça de ',
  'plaça del ',
  "plaça de l'",
  'ronda de ',
  'ronda del ',
  "ronda de l'",
  'calle de ',
  'calle del ',
  "calle de l'",
  'gran via ',
  'travessera de ',
  'carretera de ',
];

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function truncateToSentences(text: string): string {
  if (text.length <= MAX_CHARS) return text;
  const sentences = text.split(/(?<=\.)\s+/);
  let result = '';
  for (const s of sentences) {
    const candidate = result ? `${result} ${s}` : s;
    if (candidate.length > MAX_CHARS) break;
    result = candidate;
  }
  return result || text.slice(0, MAX_CHARS);
}

function getSearchQuery(streetName: string): string {
  const lower = streetName.toLowerCase();
  for (const prefix of STRIP_PREFIXES) {
    if (lower.startsWith(prefix)) {
      return streetName.slice(prefix.length);
    }
  }
  return streetName;
}

// Batch fetch extracts for multiple titles in one Wikipedia API call.
// Returns a map of title (normalized) → extract text.
async function batchFetchExtracts(lang: string, titles: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const titlesParam = titles.map(t => encodeURIComponent(t)).join('|');
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${titlesParam}&prop=extracts&exintro=1&exsentences=3&format=json&origin=*`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return result;
    const data = (await res.json()) as {
      query?: {
        pages?: Record<string, { title: string; extract?: string; missing?: string }>;
        normalized?: Array<{ from: string; to: string }>;
      };
    };
    if (!data.query?.pages) return result;

    // Build a map of normalized title → original title
    const normMap = new Map<string, string>();
    for (const t of titles) normMap.set(t.toLowerCase(), t);
    if (data.query.normalized) {
      for (const n of data.query.normalized) {
        const original = normMap.get(n.from.toLowerCase()) ?? n.from;
        normMap.set(n.to.toLowerCase(), original);
      }
    }

    for (const page of Object.values(data.query.pages)) {
      if (page.missing !== undefined || !page.extract) continue;
      // Map back to the original title we sent
      const originalTitle = normMap.get(page.title.toLowerCase()) ?? page.title;
      const extract = page.extract.replace(/<[^>]+>/g, '').trim();
      if (extract) result.set(originalTitle, truncateToSentences(extract));
    }
  } catch {
    // ignore
  }
  return result;
}

// Search Wikipedia for a street name and return the extract if relevant.
async function searchFetch(lang: string, streetName: string): Promise<string | null> {
  const query = getSearchQuery(streetName);
  const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1&srprop=&format=json&origin=*`;
  try {
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { query?: { search?: Array<{ title: string }> } };
    const results = data.query?.search;
    if (!results || results.length === 0) return null;
    const topTitle = results[0].title;
    // Relevance filter: at least one meaningful word from the query in the result title
    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3);
    const titleLower = topTitle.toLowerCase();
    const isRelevant = queryWords.length === 0 || queryWords.some(w => titleLower.includes(w));
    if (!isRelevant) return null;

    // Fetch the extract for the found article
    await sleep(300);
    const extracts = await batchFetchExtracts(lang, [topTitle]);
    return extracts.get(topTitle) ?? null;
  } catch {
    return null;
  }
}

function loadExisting(): Curiosities {
  try {
    return JSON.parse(readFileSync(OUT_PATH, 'utf-8')) as Curiosities;
  } catch {
    return {};
  }
}

async function main() {
  const streets: Street[] = JSON.parse(
    readFileSync(join(process.cwd(), 'public/streets.json'), 'utf-8')
  );
  const quizPlan: QuizPlan = JSON.parse(
    readFileSync(join(process.cwd(), 'public/quizPlan.json'), 'utf-8')
  );

  const quizIds = new Set<string>();
  for (const quiz of quizPlan.quizzes) {
    for (const q of quiz.questions) quizIds.add(q.correctId);
  }

  const streetMap = new Map<string, string>();
  for (const s of streets) {
    if (quizIds.has(s.id)) streetMap.set(s.id, s.name);
  }

  console.log(`Found ${streetMap.size} unique quiz streets.\n`);

  const existing = loadExisting();

  // Filter to streets not yet fetched
  const toFetch: Array<[string, string]> = [];
  for (const [id, name] of streetMap) {
    if (existing[id] === undefined) toFetch.push([id, name]);
  }
  console.log(
    `Already fetched: ${streetMap.size - toFetch.length}. Remaining: ${toFetch.length}\n`
  );

  // Process in batches per language
  for (const lang of LANGS) {
    console.log(`\n── Fetching ${lang.toUpperCase()} extracts ──`);
    const chunks: Array<Array<[string, string]>> = [];
    for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
      chunks.push(toFetch.slice(i, i + BATCH_SIZE));
    }

    for (let ci = 0; ci < chunks.length; ci++) {
      const chunk = chunks[ci];
      const titles = chunk.map(([, name]) => name);
      process.stdout.write(`  Batch ${ci + 1}/${chunks.length} (${titles.length} streets)... `);
      const extracts = await batchFetchExtracts(lang, titles);
      process.stdout.write(`${extracts.size} hits\n`);

      for (const [id, name] of chunk) {
        if (extracts.has(name)) {
          if (!existing[id]) existing[id] = {};
          existing[id][lang] = extracts.get(name)!;
        }
      }

      writeFileSync(OUT_PATH, JSON.stringify(existing, null, 2));
      if (ci < chunks.length - 1) await sleep(DELAY_MS);
    }

    // Search fallback for streets that got no extract
    const missing = toFetch.filter(([id]) => !existing[id]?.[lang]);
    if (missing.length > 0) {
      console.log(`  Searching ${missing.length} streets without exact match...`);
      let searchHits = 0;
      for (let i = 0; i < missing.length; i++) {
        const [id, name] = missing[i];
        const text = await searchFetch(lang, name);
        if (text) {
          if (!existing[id]) existing[id] = {};
          existing[id][lang] = text;
          searchHits++;
          process.stdout.write(`  [${lang}] ✓ ${name.slice(0, 50)}\n`);
        }
        await sleep(400);
        if (i % 20 === 19) writeFileSync(OUT_PATH, JSON.stringify(existing, null, 2));
      }
      console.log(`  Search found ${searchHits} additional ${lang} entries.`);
      writeFileSync(OUT_PATH, JSON.stringify(existing, null, 2));
    }
  }

  // Mark streets with no data across all languages
  for (const [id] of toFetch) {
    if (existing[id] === undefined) existing[id] = {};
  }
  writeFileSync(OUT_PATH, JSON.stringify(existing, null, 2));

  const total = streetMap.size;
  const hits = Object.values(existing).filter(v => Object.keys(v).length > 0).length;
  console.log(`\n✓ Done. ${hits}/${total} streets have at least one curiosity.`);
  console.log(`  Coverage: ${Math.round((hits / total) * 100)}%`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
