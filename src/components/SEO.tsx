import { useEffect } from "react";

/**
 * Canonical site URL. Single source of truth for absolute URLs in meta tags.
 */
const SITE_URL = "https://retrofly.app";
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/retrofly-social-card.svg`;
const DEFAULT_DESCRIPTION =
  "Async retrospective workspace for collecting feedback, finding themes, and tracking action items.";
const DEFAULT_TITLE = "Retrofly — Better retros, fewer meetings";

interface SEOProps {
  /** Page-specific title fragment. Rendered as "{title} · Retrofly". Omit for the brand title. */
  title?: string;
  /** Page-specific meta description. Falls back to the brand description. */
  description?: string;
  /** Absolute path (e.g. "/login"). Falls back to the current location. */
  path?: string;
  /** When true, sets robots to noindex,nofollow. Use for utility pages (404, auth callback). */
  noindex?: boolean;
  /** Override the Open Graph / Twitter image. Should be an absolute URL. */
  ogImage?: string;
}

const upsertMeta = (
  attr: "name" | "property",
  key: string,
  content: string,
): void => {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const upsertCanonical = (href: string): void => {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

/**
 * Per-page SEO helper that updates the document title, description, canonical
 * URL, and OpenGraph/Twitter cards from inside a Single Page Application.
 *
 * Render once near the top of each route component:
 *
 *   <SEO title="Sign in" path="/login" />
 */
const SEO = ({ title, description, path, noindex, ogImage }: SEOProps) => {
  useEffect(() => {
    const resolvedTitle = title ? `${title} · Retrofly` : DEFAULT_TITLE;
    const resolvedDescription = description ?? DEFAULT_DESCRIPTION;
    const resolvedPath =
      path ?? (typeof window !== "undefined" ? window.location.pathname : "/");
    const resolvedUrl = `${SITE_URL}${resolvedPath}`;
    const resolvedImage = ogImage ?? DEFAULT_OG_IMAGE;

    document.title = resolvedTitle;

    upsertMeta("name", "description", resolvedDescription);
    upsertMeta(
      "name",
      "robots",
      noindex ? "noindex,nofollow" : "index,follow",
    );
    upsertCanonical(resolvedUrl);

    upsertMeta("property", "og:title", resolvedTitle);
    upsertMeta("property", "og:description", resolvedDescription);
    upsertMeta("property", "og:url", resolvedUrl);
    upsertMeta("property", "og:image", resolvedImage);

    upsertMeta("name", "twitter:title", resolvedTitle);
    upsertMeta("name", "twitter:description", resolvedDescription);
    upsertMeta("name", "twitter:image", resolvedImage);
  }, [title, description, path, noindex, ogImage]);

  return null;
};

export default SEO;
