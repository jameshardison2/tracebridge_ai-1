import fetch from 'node-fetch';

async function testSearch(query: string) {
  console.log(`Searching DuckDuckGo for: "${query}"...`);
  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.log(`Error: ${response.status} ${response.statusText}`);
      return;
    }

    const html = await response.text();
    // Look for results
    console.log(`Successfully fetched search HTML! Length: ${html.length} bytes.`);
    
    // Scrape result snippets (DuckDuckGo HTML results use class "result__snippet")
    const snippets: string[] = [];
    const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    while ((match = snippetRegex.exec(html)) !== null) {
      const cleanSnippet = match[1].replace(/<[^>]*>/g, '').trim();
      snippets.push(cleanSnippet);
    }

    console.log(`Found ${snippets.length} snippets:`);
    snippets.slice(0, 5).forEach((snippet, idx) => {
      console.log(`  ${idx + 1}. ${snippet}`);
    });
  } catch (error: any) {
    console.error("Search failed:", error.message);
  }
}

testSearch("Okey Mbanugo LinkedIn");
