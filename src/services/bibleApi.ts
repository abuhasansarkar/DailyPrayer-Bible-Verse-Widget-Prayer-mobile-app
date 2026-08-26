import type {
  BibleChapterResponse,
  BibleChapterVerse,
  BibleVerse,
  BibleVersion,
} from "../types/bible";

const BIBLE_API_BASE_URL =
  "https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles";

const DEFAULT_TIMEOUT = 15_000;

export class BibleApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "BibleApiError";
    this.status = status;
  }
}

/**
 * Safely encode a path parameter.
 *
 * Examples:
 * "en-kjv" -> "en-kjv"
 * "1 John" -> "1%20John"
 */
function encodePathSegment(value: string | number): string {
  const normalizedValue = String(value).trim();

  if (!normalizedValue) {
    throw new BibleApiError("A required Bible API parameter is empty.");
  }

  return encodeURIComponent(normalizedValue);
}

async function requestJson<T>(
  url: string,
  timeout = DEFAULT_TIMEOUT,
): Promise<T> {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new BibleApiError(
          "The requested translation, book, chapter, or verse was not found.",
          404,
        );
      }

      throw new BibleApiError(
        `Bible API request failed with status ${response.status}.`,
        response.status,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof BibleApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new BibleApiError("The Bible API request timed out.");
    }

    throw new BibleApiError(
      error instanceof Error
        ? error.message
        : "An unknown Bible API error occurred.",
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Normalize a translation id to a jsDelivr CDN version id.
 *
 * Only public-domain editions are mapped. Copyrighted translations are
 * deliberately absent: aliasing e.g. NIV to en-kjv would serve KJV text
 * under an NIV label, which is both wrong and a licensing problem.
 * Anything unrecognised falls back to KJV.
 */
export function normalizeVersion(version?: string): string {
  if (!version) return "en-kjv";
  const trimmed = version.trim();
  if (trimmed.includes("-")) return trimmed.toLowerCase();
  const versionMap: Record<string, string> = {
    KJV: "en-kjv",
    AKJV: "en-akjv",
    ASV: "en-asv",
    WEB: "en-web",
  };
  return versionMap[trimmed.toUpperCase()] ?? "en-kjv";
}

/**
 * Normalize book name or slug to valid jsDelivr repository folder slug.
 * Examples:
 * "1 John" -> "1john"
 * "Genesis" -> "genesis"
 * "Song of Solomon" -> "songofsolomon"
 */
export function normalizeBookSlug(book: string): string {
  if (!book) return "genesis";
  const trimmed = book.trim().toLowerCase();
  return trimmed.replace(/\s+/g, "");
}

/**
 * Helper to get normalized book slug.
 */
export function getBookSlug(bookName: string): string {
  return normalizeBookSlug(bookName);
}

/**
 * Load a single Bible verse.
 *
 * Example:
 * getBibleVerse({
 *   version: "en-kjv",
 *   book: "john",
 *   chapter: 3,
 *   verse: 16,
 * });
 */
export async function getBibleVerse({
  version,
  book,
  chapter,
  verse,
}: {
  version?: string;
  book: string;
  chapter: number;
  verse: number;
}): Promise<BibleVerse> {
  const resolvedVersion = normalizeVersion(version);
  const resolvedBook = normalizeBookSlug(book);
  const url =
    `${BIBLE_API_BASE_URL}/${encodePathSegment(resolvedVersion)}` +
    `/books/${encodePathSegment(resolvedBook)}` +
    `/chapters/${encodePathSegment(chapter)}` +
    `/verses/${encodePathSegment(verse)}.json`;

  try {
    return await requestJson<BibleVerse>(url);
  } catch (error) {
    if (resolvedVersion !== "en-kjv") {
      const fallbackUrl =
        `${BIBLE_API_BASE_URL}/en-kjv` +
        `/books/${encodePathSegment(resolvedBook)}` +
        `/chapters/${encodePathSegment(chapter)}` +
        `/verses/${encodePathSegment(verse)}.json`;
      return await requestJson<BibleVerse>(fallbackUrl);
    }
    throw error;
  }
}

/**
 * Load an entire chapter.
 */
export async function getBibleChapter({
  version,
  book,
  chapter,
}: {
  version?: string;
  book: string;
  chapter: number;
}): Promise<BibleChapterVerse[]> {
  const resolvedVersion = normalizeVersion(version);
  const resolvedBook = normalizeBookSlug(book);
  const url =
    `${BIBLE_API_BASE_URL}/${encodePathSegment(resolvedVersion)}` +
    `/books/${encodePathSegment(resolvedBook)}` +
    `/chapters/${encodePathSegment(chapter)}.json`;

  try {
    const response = await requestJson<BibleChapterResponse>(url);
    const uniqueVerses = new Map<string, BibleChapterVerse>();

    for (const item of response.data ?? []) {
      if (!uniqueVerses.has(item.verse)) {
        uniqueVerses.set(item.verse, item);
      }
    }

    return Array.from(uniqueVerses.values()).sort(
      (first, second) => Number(first.verse) - Number(second.verse),
    );
  } catch (error) {
    if (resolvedVersion !== "en-kjv") {
      const fallbackUrl =
        `${BIBLE_API_BASE_URL}/en-kjv` +
        `/books/${encodePathSegment(resolvedBook)}` +
        `/chapters/${encodePathSegment(chapter)}.json`;
      const fallbackResponse = await requestJson<BibleChapterResponse>(fallbackUrl);
      const uniqueVerses = new Map<string, BibleChapterVerse>();

      for (const item of fallbackResponse.data ?? []) {
        if (!uniqueVerses.has(item.verse)) {
          uniqueVerses.set(item.verse, item);
        }
      }

      return Array.from(uniqueVerses.values()).sort(
        (first, second) => Number(first.verse) - Number(second.verse),
      );
    }
    throw error;
  }
}

/**
 * Load all translation metadata.
 */
export async function getBibleVersions(): Promise<BibleVersion[]> {
  const url = `${BIBLE_API_BASE_URL}/bibles.json`;

  const response = await requestJson<
    BibleVersion[] | { data: BibleVersion[] }
  >(url);

  // Supports either possible response structure.
  return Array.isArray(response) ? response : response.data;
}

/**
 * Clean raw CDN verse text for display.
 *
 * Strips two artefacts the source embeds:
 *  - leading pilcrow paragraph markers (`¶`)
 *  - translator marginal notes, appended with no separator as
 *    `<chapter>.<verse> <note>` — e.g. "…an expected end.29.11 expected…: Heb."
 *    A note marker is always glued directly to the preceding character, so a
 *    number preceded by whitespace (normal prose) is left alone.
 */
export function formatBibleText(text: string): string {
  let out = text.replace(/^¶\s*/, "").replace(/\s+/g, " ").trim();
  const note = out.match(/\S\d+\.\d+\s/);
  if (note && note.index !== undefined) {
    out = out.slice(0, note.index + 1);
  }
  return out.trim();
}

