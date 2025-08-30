const preloadImageCache = new Map<string, HTMLImageElement>();

export function preloadImage(url: string) {
  if (!preloadImageCache.has(url)) {
    const img = new Image();
    img.src = url;
    preloadImageCache.set(url, img);
  }
}
