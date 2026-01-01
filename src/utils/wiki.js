// Utility to fetch images from Wikipedia
// Spec: Uses MediaWiki API (standard for this use case)

const WIKI_API_BASE = "https://ca.wikipedia.org/w/api.php"; // Use Catalan Wikipedia for Barcelona relevance
// Fallback to English if needed, but CA is better for "Carrer de..."

export const fetchWikiImage = async (query) => {
    if (!query) return null;

    // Clean query
    const cleanQuery = query.trim();

    // 1. Try direct search for page images
    const params = new URLSearchParams({
        action: 'query',
        titles: cleanQuery,
        prop: 'pageimages',
        format: 'json',
        pithumbsize: 600,
        origin: '*' // CORS
    });

    try {
        const response = await fetch(`${WIKI_API_BASE}?${params.toString()}`);
        const data = await response.json();
        const pages = data.query?.pages;

        if (pages) {
            const pageId = Object.keys(pages)[0];
            if (pageId !== "-1") {
                const page = pages[pageId];
                if (page.thumbnail?.source) {
                    return page.thumbnail.source;
                }
            }
        }

        // 2. If no direct hit, try searching for the street name specifically as a search term
        // NOTE: "Carrer de Balmes" might redirect to "Balmes" or vice versa
        // We can try a broader search if specific fails, but precise is safer for "curiosity" context.
        return null;

    } catch (error) {
        console.error("Wiki fetch error:", error);
        return null;
    }
};
