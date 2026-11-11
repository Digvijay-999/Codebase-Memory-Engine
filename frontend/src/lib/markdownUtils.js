/**
 * Converts known safe GitHub README HTML patterns (such as centered logo/images)
 * into standard Markdown image syntax without executing arbitrary HTML.
 * Legitimate code blocks (fenced with ```) are preserved as-is.
 */
export function convertSafeHtmlToMarkdown(content) {
  if (!content) return '';
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, index) => {
    // Odd indices are code blocks: leave untouched
    if (index % 2 === 1) return part;

    let res = part;
    // 1. Convert <img ...> into ![alt](src) safely, regardless of attribute ordering or extra attributes
    res = res.replace(/<img\b([^>]*?)\/?>/gi, (match, attrs) => {
      const srcMatch = attrs.match(/\bsrc=["']([^"']+)["']/i);
      if (!srcMatch) return match;
      const altMatch = attrs.match(/\balt=["']([^"']*)["']/i);
      const src = srcMatch[1];
      const alt = altMatch ? altMatch[1] : '';
      return `![${alt}](${src})`;
    });

    // 2. Convert <a href="...">...</a> wrapping markdown image into [![alt](src)](href)
    res = res.replace(/<a\b([^>]*?)>\s*(!\[[^\]]*\]\([^)]+\))\s*<\/a>/gi, (match, attrs, img) => {
      const hrefMatch = attrs.match(/\bhref=["']([^"']+)["']/i);
      if (!hrefMatch) return match;
      return `[${img}](${hrefMatch[1]})`;
    });

    // 3. Remove common centering and paragraph container tags: <div align="center">, </div>, <p align="center">, </p>, <br>, <br/>
    res = res.replace(/<\/?(?:div|p)\b[^>]*>/gi, '\n');
    res = res.replace(/<br\s*\/?>/gi, '\n');

    return res;
  }).join('');
}

/**
 * Resolves markdown links so that repository-relative paths or accidental localhost URLs
 * point to the real GitHub source repository rather than ContextForge's local origin.
 */
export function resolveLinkHref(href, repoUrl) {
  if (!href) return '#';

  // 1. If it's an accidental localhost URL, strip the localhost origin
  const cleanHref = href.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/?/, '/');

  // 2. If it's an anchor or mailto, leave as is
  if (cleanHref.startsWith('#') || cleanHref.startsWith('mailto:')) {
    return cleanHref;
  }

  // 3. If it's an absolute external URL (http:// or https://)
  if (/^https?:\/\//i.test(cleanHref)) {
    return cleanHref;
  }

  // 4. Relative repository path (e.g. "LICENSE.txt", "./docs/foo.md", "/LICENSE")
  const relativePath = cleanHref.replace(/^\.?\//, '');

  if (repoUrl) {
    const cleanRepoUrl = repoUrl.replace(/\.git$/, '').replace(/\/$/, '');
    return `${cleanRepoUrl}/blob/HEAD/${relativePath}`;
  }

  return cleanHref;
}

/**
 * True for an http(s) image on another origin. The CSP blocks those, so they are shown as links and never requested.
 */
export function isExternalImage(src) {
  try {
    const url = new URL(src, window.location.href);
    return url.protocol.startsWith('http') && url.origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * For a link wrapping an external image ([![alt](img)](href)): the alt text to show in place of the image,
 * so an image link never nests inside a link.
 */
export function linkedImageLabel(node, repoUrl) {
  const img = node?.children?.find((child) => child.tagName === 'img');
  return img && isExternalImage(resolveImageSrc(img.properties?.src, repoUrl)) ? (img.properties.alt || 'Image') : undefined;
}

/**
 * Resolves markdown image sources so relative images point to raw GitHub content.
 */
export function resolveImageSrc(src, repoUrl) {
  if (!src) return '';
  const cleanSrc = src.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/?/, '/');
  if (/^https?:\/\//i.test(cleanSrc) || cleanSrc.startsWith('data:')) {
    return cleanSrc;
  }
  const relativePath = cleanSrc.replace(/^\.?\//, '');
  if (repoUrl) {
    const cleanRepoUrl = repoUrl.replace(/\.git$/, '').replace(/\/$/, '');
    return `${cleanRepoUrl}/raw/HEAD/${relativePath}`;
  }
  return cleanSrc;
}
