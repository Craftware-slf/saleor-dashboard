import { type LanguageFragment } from "@dashboard/graphql";

// Craftware/Örninn: Saleor exposes ~779 locales (Afrikaans, Aghem, …), but the
// store only operates in English (base) and Icelandic. This is the single source
// of truth for which languages the Translations section shows — both the language
// list (TranslationsLanguageList) and the per-page language picker (LanguageSwitch).
//
// Danish ("DA") was previously reserved here for planned DK brands; it was removed
// per current scope (EN + IS only). Re-add "DA" to this set if the DK brands launch.
export const ALLOWED_LANGUAGE_CODES = new Set<string>(["EN", "IS"]);

/**
 * Keep only the languages the store actually uses. `alwaysInclude` (e.g. the
 * currently-selected language) is never filtered out, so the picker can still
 * display a language that's already in use even if it's not in the allow-list.
 */
export const filterEnabledLanguages = (
  languages: LanguageFragment[] = [],
  alwaysInclude?: string,
): LanguageFragment[] =>
  languages.filter(
    language => ALLOWED_LANGUAGE_CODES.has(language.code) || language.code === alwaysInclude,
  );
