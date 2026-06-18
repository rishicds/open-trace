/** Canonical page URL: origin + pathname, no query/hash, no trailing slash (except root). */
export function normalizePageUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    u.search = '';
    let pathname = u.pathname || '/';
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    return `${u.origin}${pathname}`;
  } catch {
    return url;
  }
}

/** Match all stored URL variants that normalize to the same page. */
export function pageUrlMatchRegex(normalizedUrl: string): RegExp {
  const u = new URL(normalizedUrl);
  const origin = u.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const path = u.pathname === '/'
    ? '/?'
    : u.pathname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/?';
  return new RegExp(`^${origin}${path}(\\?[^#]*)?(#.*)?$`, 'i');
}
