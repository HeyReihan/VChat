import LZString from 'lz-string';

// Compress string to a URL-safe format
export const compressData = (data: string): string => {
  return LZString.compressToEncodedURIComponent(data);
};

// Decompress string from URL-safe format
export const decompressData = (data: string): string | null => {
  return LZString.decompressFromEncodedURIComponent(data);
};