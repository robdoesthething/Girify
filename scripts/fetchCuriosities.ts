#!/usr/bin/env tsx
/**
 * Fetches curiosity descriptions for Barcelona streets.
 * Run with: npx tsx scripts/fetchCuriosities.ts
 *
 * CA: carrers.barcelona (official Ajuntament nomenclàtor data — primary source)
 * ES/EN: Wikipedia batch API + search fallback
 *
 * Covers ALL streets in streets.json (not just quiz plan) so future quiz days
 * are already populated. Results saved incrementally to public/streetCuriosities.json.
 *
 * Flags:
 *   --skip-ca      Skip the carrers.barcelona CA pass
 *   --skip-wiki    Skip the Wikipedia ES/EN pass
 *   --skip-img     Skip the Wikimedia Commons image pass
 *   --reset-ca     Re-fetch CA even for streets that already have it
 *   --reset-img    Re-fetch images even for streets that already have one
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Street {
  id: string;
  name: string;
}

interface Curiosity {
  ca?: string;
  es?: string;
  en?: string;
  img?: string;
}

type Curiosities = Record<string, Curiosity>;

const WIKI_LANGS = ['es', 'en'] as const;
const WIKI_BATCH_SIZE = 40;
const WIKI_DELAY_MS = 1000;
const CA_DELAY_MS = 400;
const MAX_CHARS = 280;
const OUT_PATH = join(process.cwd(), 'public/streetCuriosities.json');

const SKIP_CA = process.argv.includes('--skip-ca');
const SKIP_WIKI = process.argv.includes('--skip-wiki');
const SKIP_IMG = process.argv.includes('--skip-img');
const RESET_CA = process.argv.includes('--reset-ca');
const RESET_IMG = process.argv.includes('--reset-img');

// Strip Catalan/Spanish street type prefixes when searching Wikipedia
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
  'gran via ',
  'travessera de ',
  'carretera de ',
  'baixada de ',
  'passatge de ',
  'passatge del ',
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
    if (lower.startsWith(prefix)) return streetName.slice(prefix.length);
  }
  return streetName;
}

// Convert a street name to the carrers.barcelona URL slug.
// "Carrer d'Aragó" → "carrer-d-arago"
// "Gran Via de les Corts Catalanes" → "gran-via-de-les-corts-catalanes"
function toCarrersBcnSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/'/g, '-') // apostrophe → hyphen
    .replace(/\s+/g, '-') // spaces → hyphens
    .replace(/-+/g, '-') // collapse runs
    .replace(/[^a-z0-9-]/g, '') // strip remaining specials
    .replace(/^-|-$/g, ''); // trim edges
}

// Fetch Catalan street description from carrers.barcelona.
// Returns the first paragraph of the page (etymology/history) or null.
async function fetchCarrersBcn(streetName: string): Promise<string | null> {
  const slug = toCarrersBcnSlug(streetName);
  if (!slug) return null;
  const url = `https://carrers.barcelona/vies/${slug}.html`;
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
      headers: { 'User-Agent': 'Girify/1.0 (Barcelona streets quiz; educational)' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    // First <p> is the etymology description
    const match = html.match(/<p>([^<]+)<\/p>/);
    if (!match) return null;
    const text = match[1].trim();
    // Skip if too short (likely a stub or metadata line)
    if (text.length < 25) return null;
    // Skip lines that start with "El nom actual" (date metadata, not description)
    if (text.startsWith('El nom actual')) return null;
    return truncateToSentences(text);
  } catch {
    return null;
  }
}

// Batch fetch Wikipedia extracts for multiple titles in one request.
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
      const originalTitle = normMap.get(page.title.toLowerCase()) ?? page.title;
      const extract = page.extract.replace(/<[^>]+>/g, '').trim();
      if (extract) result.set(originalTitle, truncateToSentences(extract));
    }
  } catch {
    // ignore transient errors
  }
  return result;
}

// Wikipedia search fallback: find the best-matching article and return its extract.
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
    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3);
    const isRelevant =
      queryWords.length === 0 || queryWords.some(w => topTitle.toLowerCase().includes(w));
    if (!isRelevant) return null;
    await sleep(300);
    const extracts = await batchFetchExtracts(lang, [topTitle]);
    return extracts.get(topTitle) ?? null;
  } catch {
    return null;
  }
}

// Fetch a free-license thumbnail from Wikimedia Commons for a street.
// Searches "{streetName} Barcelona" to prefer actual street photos.
async function fetchCommonsImage(streetName: string): Promise<string | null> {
  const query = `${getSearchQuery(streetName)} Barcelona`;
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query` +
    `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5` +
    `&prop=imageinfo&iiprop=url%7Cmime%7Cextmetadata&iiurlwidth=400` +
    `&format=json&origin=*`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          {
            imageinfo?: Array<{
              url?: string;
              thumburl?: string;
              mime?: string;
              extmetadata?: { LicenseShortName?: { value: string } };
            }>;
          }
        >;
      };
    };
    const pages = Object.values(data.query?.pages ?? {});
    for (const page of pages) {
      const ii = page.imageinfo?.[0];
      if (!ii) continue;
      const mime = ii.mime ?? '';
      if (!mime.startsWith('image/jpeg') && !mime.startsWith('image/png')) continue;
      const license = ii.extmetadata?.LicenseShortName?.value ?? '';
      // All Commons content is free, but exclude anything with NC just in case
      if (license.includes('NC')) continue;
      const thumbUrl = ii.thumburl ?? ii.url;
      if (!thumbUrl) continue;
      return thumbUrl;
    }
    return null;
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

  console.log(`Loaded ${streets.length} streets from streets.json.\n`);

  const existing = loadExisting();

  // ── Pass 1: CA from carrers.barcelona ──────────────────────────────────────
  if (!SKIP_CA) {
    const caNeeded = streets.filter(s => RESET_CA || !existing[s.id]?.ca);
    console.log(`── CA pass: ${caNeeded.length} streets to fetch from carrers.barcelona`);
    if (RESET_CA) console.log('   (--reset-ca: overwriting existing CA data)');

    let hits = 0;
    let misses = 0;
    for (let i = 0; i < caNeeded.length; i++) {
      const { id, name } = caNeeded[i];
      const text = await fetchCarrersBcn(name);
      if (text) {
        if (!existing[id]) existing[id] = {};
        existing[id].ca = text;
        hits++;
        process.stdout.write(`  ✓ ${name.slice(0, 60)}\n`);
      } else {
        misses++;
      }
      await sleep(CA_DELAY_MS);
      if (i % 50 === 49) {
        writeFileSync(OUT_PATH, JSON.stringify(existing));
        console.log(
          `  [${i + 1}/${caNeeded.length}] saved — ${hits} hits, ${misses} misses so far`
        );
      }
    }
    writeFileSync(OUT_PATH, JSON.stringify(existing));
    console.log(`\n  CA done: ${hits} hits out of ${caNeeded.length} streets.\n`);
  }

  // ── Pass 2: ES/EN from Wikipedia ───────────────────────────────────────────
  if (!SKIP_WIKI) {
    for (const lang of WIKI_LANGS) {
      const wikiNeeded = streets.filter(s => !existing[s.id]?.[lang]);
      console.log(
        `\n── ${lang.toUpperCase()} pass: ${wikiNeeded.length} streets to fetch from Wikipedia`
      );

      // Batch fetch
      const chunks: Street[][] = [];
      for (let i = 0; i < wikiNeeded.length; i += WIKI_BATCH_SIZE) {
        chunks.push(wikiNeeded.slice(i, i + WIKI_BATCH_SIZE));
      }
      for (let ci = 0; ci < chunks.length; ci++) {
        const chunk = chunks[ci];
        process.stdout.write(`  Batch ${ci + 1}/${chunks.length} (${chunk.length} streets)... `);
        const extracts = await batchFetchExtracts(
          lang,
          chunk.map(s => s.name)
        );
        process.stdout.write(`${extracts.size} hits\n`);
        for (const s of chunk) {
          if (extracts.has(s.name)) {
            if (!existing[s.id]) existing[s.id] = {};
            existing[s.id][lang] = extracts.get(s.name)!;
          }
        }
        writeFileSync(OUT_PATH, JSON.stringify(existing));
        if (ci < chunks.length - 1) await sleep(WIKI_DELAY_MS);
      }

      // Search fallback for streets that got nothing
      const stillMissing = wikiNeeded.filter(s => !existing[s.id]?.[lang]);
      if (stillMissing.length > 0) {
        console.log(`  Searching ${stillMissing.length} streets without exact match...`);
        let searchHits = 0;
        for (let i = 0; i < stillMissing.length; i++) {
          const s = stillMissing[i];
          const text = await searchFetch(lang, s.name);
          if (text) {
            if (!existing[s.id]) existing[s.id] = {};
            existing[s.id][lang] = text;
            searchHits++;
            process.stdout.write(`  [${lang}] ✓ ${s.name.slice(0, 50)}\n`);
          }
          await sleep(400);
          if (i % 20 === 19) writeFileSync(OUT_PATH, JSON.stringify(existing));
        }
        console.log(`  Search found ${searchHits} additional ${lang} entries.`);
        writeFileSync(OUT_PATH, JSON.stringify(existing));
      }
    }
  }

  // ── Pass 3: Images from Wikimedia Commons ─────────────────────────────────
  if (!SKIP_IMG) {
    const imgNeeded = streets.filter(s => RESET_IMG || !existing[s.id]?.img);
    console.log(`\n── IMG pass: ${imgNeeded.length} streets to fetch from Wikimedia Commons`);

    let imgHits = 0;
    let imgMisses = 0;
    for (let i = 0; i < imgNeeded.length; i++) {
      const { id, name } = imgNeeded[i];
      const thumbUrl = await fetchCommonsImage(name);
      if (thumbUrl) {
        if (!existing[id]) existing[id] = {};
        existing[id].img = thumbUrl;
        imgHits++;
        process.stdout.write(`  🖼 ${name.slice(0, 60)}\n`);
      } else {
        imgMisses++;
      }
      await sleep(400);
      if (i % 50 === 49) {
        writeFileSync(OUT_PATH, JSON.stringify(existing));
        console.log(
          `  [${i + 1}/${imgNeeded.length}] saved — ${imgHits} hits, ${imgMisses} misses so far`
        );
      }
    }
    writeFileSync(OUT_PATH, JSON.stringify(existing));
    console.log(`\n  IMG done: ${imgHits} hits out of ${imgNeeded.length} streets.\n`);
  }

  writeFileSync(OUT_PATH, JSON.stringify(existing));

  const total = streets.length;
  const withAny = Object.values(existing).filter(v => v.ca || v.es || v.en).length;
  const withCa = Object.values(existing).filter(v => v.ca).length;
  const withImg = Object.values(existing).filter(v => v.img).length;
  console.log(`\n✓ Done.`);
  console.log(`  CA coverage:  ${withCa}/${total} (${Math.round((withCa / total) * 100)}%)`);
  console.log(`  Any language: ${withAny}/${total} (${Math.round((withAny / total) * 100)}%)`);
  console.log(`  Images:       ${withImg}/${total} (${Math.round((withImg / total) * 100)}%)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
