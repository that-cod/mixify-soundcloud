
import { AudioFeatures, SeparatedTracks, PrecomputedOperations } from '@/types/audio';

// Cache expiration time (24 hours)
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

// In-memory cache
const analysisCache = new Map<string, AudioFeatures>();
const stemCache = new Map<string, SeparatedTracks>();
const precomputedOpsCache = new Map<string, PrecomputedOperations>();

// Generate a cache key from track URL and optional params
export const generateCacheKey = (trackUrl: string, params?: Record<string, any>): string => {
  const baseKey = trackUrl.split('?')[0]; // Remove query params
  if (!params) return baseKey;
  
  // Add params to cache key if provided
  const paramsStr = Object.entries(params)
    .sort(([k1], [k2]) => k1.localeCompare(k2))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  
  return `${baseKey}:${paramsStr}`;
};

// Store analysis results in cache
export const cacheAnalysisResults = (
  trackUrl: string, 
  features: AudioFeatures,
  params?: Record<string, any>
): void => {
  const cacheKey = generateCacheKey(trackUrl, params);
  analysisCache.set(cacheKey, {
    ...features,
    cached: true,
    cacheTimestamp: Date.now()
  });
  
  // Also store in localStorage for persistence across sessions
  try {
    const storageKey = `analysis_cache_${cacheKey}`;
    localStorage.setItem(storageKey, JSON.stringify({
      ...features,
      cached: true,
      cacheTimestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Failed to cache analysis to localStorage:', e);
  }
};

// Get cached analysis results
export const getCachedAnalysis = (
  trackUrl: string,
  params?: Record<string, any>
): AudioFeatures | null => {
  const cacheKey = generateCacheKey(trackUrl, params);
  
  // Try in-memory cache first
  if (analysisCache.has(cacheKey)) {
    const cached = analysisCache.get(cacheKey)!;
    
    // Check if cache is expired
    if (cached.cacheTimestamp && Date.now() - cached.cacheTimestamp < CACHE_EXPIRY) {
      return cached;
    }
    
    // Expired, remove from cache
    analysisCache.delete(cacheKey);
  }
  
  // Try localStorage
  try {
    const storageKey = `analysis_cache_${cacheKey}`;
    const cachedStr = localStorage.getItem(storageKey);
    
    if (cachedStr) {
      const cached = JSON.parse(cachedStr) as AudioFeatures;
      
      // Check if cache is expired
      if (cached.cacheTimestamp && Date.now() - cached.cacheTimestamp < CACHE_EXPIRY) {
        // Update in-memory cache and return
        analysisCache.set(cacheKey, cached);
        return cached;
      }
      
      // Expired, remove from localStorage
      localStorage.removeItem(storageKey);
    }
  } catch (e) {
    console.warn('Failed to retrieve cached analysis from localStorage:', e);
  }
  
  return null;
};

// Cache stem separation results
export const cacheStemSeparation = (
  trackUrl: string,
  stems: SeparatedTracks
): void => {
  const cacheKey = generateCacheKey(trackUrl);
  stemCache.set(cacheKey, {
    ...stems,
    cached: true
  });
};

// Get cached stem separation
export const getCachedStems = (trackUrl: string): SeparatedTracks | null => {
  const cacheKey = generateCacheKey(trackUrl);
  return stemCache.get(cacheKey) || null;
};

// Store precomputed operations
export const cachePrecomputedOps = (
  trackId: string,
  operations: PrecomputedOperations
): void => {
  precomputedOpsCache.set(trackId, {
    ...operations,
    cacheTimestamp: Date.now()
  });
};

// Get precomputed operations
export const getPrecomputedOps = (trackId: string): PrecomputedOperations | null => {
  if (precomputedOpsCache.has(trackId)) {
    const cached = precomputedOpsCache.get(trackId)!;
    
    // Check if cache is expired
    if (Date.now() - cached.cacheTimestamp < CACHE_EXPIRY) {
      return cached;
    }
    
    // Expired, remove from cache
    precomputedOpsCache.delete(trackId);
  }
  
  return null;
};

// Clear all caches
export const clearAllCaches = (): void => {
  analysisCache.clear();
  stemCache.clear();
  precomputedOpsCache.clear();
  
  // Clear localStorage cache
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('analysis_cache_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.warn('Failed to clear localStorage cache:', e);
  }
};

// Force refresh cache for a track
export const refreshCacheForTrack = (trackUrl: string): void => {
  const cacheKey = generateCacheKey(trackUrl);
  analysisCache.delete(cacheKey);
  stemCache.delete(cacheKey);
  
  // Clear from localStorage
  try {
    const storageKey = `analysis_cache_${cacheKey}`;
    localStorage.removeItem(storageKey);
  } catch (e) {
    console.warn('Failed to remove cached analysis from localStorage:', e);
  }
};
