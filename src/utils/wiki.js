// Utility to fetch images from Wikipedia
// Spec: Uses MediaWiki API (standard for this use case)

const WIKI_API_BASE = 'https://ca.wikipedia.org/w/api.php'; // Use Catalan Wikipedia for Barcelona relevance
// Fallback to English if needed, but CA is better for "Carrer de..."

/**
 * Fetch a thumbnail image from Catalan Wikipedia for a given query.
 * Uses MediaWiki API to search for page images. Returns null if no image found.
 *
 * @param {string} query - Search term (e.g., "Sagrada Família", "Carrer de Balmes")
 * @returns {Promise<string|null>} URL of thumbnail image (600px) or null if not found
 *
 * @example
 * const imageUrl = await fetchWikiImage('Sagrada Família');
 * // Returns: "https://upload.wikimedia.org/wikipedia/commons/thumb/..."
 *
 * @example
 * const noImage = await fetchWikiImage('NonexistentPage');
 * // Returns: null
 */
export const fetchWikiImage = async query => {
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
    pithumbsize: 600,
    redirects: '1', // Follow redirects (Important for "Carrer de..." -> "Carrer...")
    origin: '*', // CORS
  });

  try {
    const response = await fetch(`${WIKI_API_BASE}?${params.toString()}`);
    const data = await response.json();
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

    // 2. Fallback: If no image found, try searching using the "search" action (fuzzier)
    // This handles cases where exact title match (even with redirects) fails.
    if (cleanQuery.length > 5) {
      const searchParams = new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: cleanQuery,
        format: 'json',
        origin: '*',
      });
      const searchResp = await fetch(`${WIKI_API_BASE}?${searchParams.toString()}`);
      const searchData = await searchResp.json();

      if (searchData.query?.search?.length > 0) {
        const bestTitle = searchData.query.search[0].title;
        // Recursively try one more time with the found best title
        if (bestTitle && bestTitle !== cleanQuery) {
          return fetchWikiImage(bestTitle);
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Wiki fetch error:', error);
    return null;
  }
};
