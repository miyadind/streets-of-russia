(function () {
  const DEV_CACHE_BUST = String(Date.now());

  function addCacheBust(url) {
    if (typeof url !== 'string') return url;
    if (!url.startsWith('assets/')) return url;
    const separator = url.includes('?') ? '&' : '?';
    return url + separator + 'dev=' + DEV_CACHE_BUST;
  }

  function patchAssetTree(value) {
    if (typeof value === 'string') return addCacheBust(value);
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) value[i] = patchAssetTree(value[i]);
      return value;
    }
    if (value && typeof value === 'object') {
      for (const key of Object.keys(value)) value[key] = patchAssetTree(value[key]);
    }
    return value;
  }

  if (typeof window !== 'undefined') window.DEV_CACHE_BUST = DEV_CACHE_BUST;
  if (typeof Assets !== 'undefined') patchAssetTree(Assets);

  console.info('[dev-cache] cache bust enabled:', DEV_CACHE_BUST);
})();
