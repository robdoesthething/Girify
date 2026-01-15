// Utility to fetch images from Wikipedia
// Spec: Uses MediaWiki API (standard for this use case)

const WIKI_API_BASE = 'https://ca.wikipedia.org/w/api.php'; // Use Catalan Wikipedia for Barcelona relevance

interface WikiQueryPage {
  pageid?: number;
  ns?: number;
  title?: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
}

interface WikiQueryResponse {
  query?: {
    pages?: Record<string, WikiQueryPage>;
    search?: Array<{ title: string }>;
  };
}

/**
 * Fetch a thumbnail image from Catalan Wikipedia for a given query.
 * Uses MediaWiki API to search for page images. Returns null if no image found.
 *
 * @param query - Search term (e.g., "Sagrada Família", "Carrer de Balmes")
 * @returns URL of thumbnail image (600px) or null if not found
 */
export const fetchWikiImage = async (query: string): Promise<string | null> => {
  if (!query) {
    return null;
  }

  // Clean query
  const cleanQuery = query.trim();

  // 1. Try direct search for page images with redirect handling
  const params = new URLSearchParams({
    action: 'query',
    titles: cleanQuery,
    prop: 'pageimages',
    format: 'json',
    pithumbsize: '600',
    redirects: '1', // Follow redirects
    origin: '*', // CORS
  });

  try {
    const response = await fetch(`${WIKI_API_BASE}?${params.toString()}`);
    const data = (await response.json()) as WikiQueryResponse;
    const pages = data.query?.pages;

    if (pages) {
      const pageId = Object.keys(pages)[0];
      if (pageId !== '-1') {
        const page = pages[pageId];
        if (page.thumbnail?.source) {
          return page.thumbnail.source;
        }
      }
    }

    // 2. Fallback: fuzzy search
    const MIN_QUERY_LENGTH = 5;
    if (cleanQuery.length > MIN_QUERY_LENGTH) {
      const searchParams = new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: cleanQuery,
        format: 'json',
        origin: '*',
      });
      const searchResp = await fetch(`${WIKI_API_BASE}?${searchParams.toString()}`);
      const searchData = (await searchResp.json()) as WikiQueryResponse;

      if (searchData.query?.search?.length && searchData.query.search.length > 0) {
        const bestTitle = searchData.query.search[0].title;
        // Recursively try one more time with the found best title
        if (bestTitle && bestTitle !== cleanQuery) {
          return await fetchWikiImage(bestTitle);
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Wiki fetch error:', error);
    return null;
  }
};
