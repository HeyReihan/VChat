import LZString from 'lz-string';

// Compress string to a URL-safe format
export const compressData = (data: string): string => {
  return LZString.compressToEncodedURIComponent(data);
};

// Decompress string from URL-safe format
export const decompressData = (data: string): string | null => {
  return LZString.decompressFromEncodedURIComponent(data);
};

// Shorten URL using TinyURL API (via CORS proxy to work in browser)
export const shortenUrl = async (longUrl: string): Promise<string> => {
  const tinyUrlApi = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`;
  
  try {
    // Use a CORS proxy to bypass browser restrictions
    const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(tinyUrlApi)}`);
    if (!response.ok) throw new Error('Shortening service request failed');
    return await response.text();
  } catch (error) {
    console.error("URL Shortening failed:", error);
    // Fallback: try direct call (may work in some environments)
    try {
        const directResponse = await fetch(tinyUrlApi);
        if (!directResponse.ok) throw new Error('Direct request failed');
        return await directResponse.text();
    } catch (directError) {
        throw new Error("Could not shorten URL. The link might be too long.");
    }
  }
};