# Localization review record

Review date: 2026-10-26. Status: **machine translations; native review pending**.

The website's owner approved publishing labeled machine translations across the canonical 50-language set. This record does not certify native fluency, legal equivalence, or the accuracy of every sentence. Structural checks and sampled language review answer different questions.

## Production and independent review

The initial non-English catalogs were generated with Gemini 2.5 Flash. A separate agent reviewed the localization implementation and reconstructed English meanings from selected translations. Each sample included the language-picker label, an unavailable-checkout button, planned codec-fee prose, and the statement requiring licenses for the graphical app, command-line tools, and validation core.

The reviewer could see the English source. These are independent semantic samples, not a blinded backtranslation study. A second model can share a generator's blind spots; a native reader remains the strongest check for fluency and specialized terminology. Low-resource locales, especially Amharic, Hausa, Igbo, Pashto and Yoruba, remain a priority for native review.

Additional Arabic, Amharic, Azerbaijani and Spanish samples covered license limits and expiration, detection/read-only operations, warranty exclusions, license identity handling, telemetry exclusions and refunds. No negation reversal or expanded commercial entitlement was found in those sampled clauses.

## Issues identified during review

- Protecting “Mecha” without word boundaries corrupted words containing those letters, including an expansion of MFIC. Standalone product name “Validate” was also being translated as a verb. The producer fixed masking and regenerated affected catalogs.
- Protecting English apostrophe entities as immutable tokens produced awkward possessives. Punctuation is now decoded before translation, while markup and product names remain protected.
- Icelandic used a word meaning logout/discharge for purchase checkout and omitted the source-code qualifier in one closed-source statement. Exact replacements were reviewed and applied to UI and policy passages.
- Smaller corrections were reviewed and applied for omitted codec/applicability qualifiers, an unselected Korean grammatical particle, and code/codec and validation/authentication terminology.
- The first implementation lacked a root-page no-JavaScript route to the language choices, lost the current locale on correction links, and omitted bidirectional isolation around searchable English errors. These were addressed in the reviewed implementation.

The [sample review record](i18n-review-samples.md) identifies concrete keys and reviewed catalog hashes. Later edits require targeted re-review; a prior catalog hash does not approve a changed file. Corrections described here were applied after those initial snapshots.

## Structural and behavioral checks

The reviewed code checks catalog key parity, nonempty strings, exact inline-markup preservation, product-name preservation, and numerical-claim preservation. It escapes translated attribute values and protects embedded runtime JSON from closing a script element. Locale resolution gives an explicit localized URL priority, then a saved preference, then ordered browser preferences, then English. Switching language retains the page, query and fragment. Five configured languages use right-to-left document direction. Translated errors retain the English source in a left-to-right isolate for searching.

Ten focused unit tests passed during the independent review in approximately 88 milliseconds. This is a unit-test observation, not a claim that the entire build, all generated pages, or every browser/locale layout was independently verified. The source parser deliberately supports the site's narrow static HTML grammar; it is not a general HTML parser or arbitrary-content sanitizer.

Structural parity cannot detect a reversed negation, an inaccurate technical term, a dropped currency symbol, or a price associated with the wrong product. A separate dollar-symbol/placeholder sweep found no missing dollar signs or unresolved translation placeholders in the catalogs available at the time of review. Meaning still needs review.

## Terminology sources and remaining work

CLDR is useful for language names and locale conventions, rather than marketing or legal prose:

- [CLDR language and locale display names](https://cldr.unicode.org/translation/displaynames/languagelocale-names)
- [CLDR language support levels](https://cldr.unicode.org/index/language-support-levels)

GNOME provides independently maintained terminology starting points, though coverage and freshness differ by locale:

- [Amharic team](https://l10n.gnome.org/teams/am/)
- [Hausa team](https://l10n.gnome.org/teams/ha/)
- [Pashto team](https://l10n.gnome.org/teams/ps/)
- [Yoruba team](https://l10n.gnome.org/teams/yo/)

Existing related-site catalogs marked as machine-translated are reusable drafts, not independent evidence. Fuzzy or obsolete glossary entries should not be treated as authoritative translations. Continued review should prioritize purchase availability, required licenses, product limits, privacy promises and refund terms before polishing slogans.

## Final numeric and inflection repair review

All 49 non-English locales received at least two UI-label samples and one product/license prose sample; most received two prose samples. Some samples were taken before unrelated catalog keys finished generating, as recorded in the detailed review record.

Additional review checked the Finnish, Japanese, Korean and Norwegian entries initially rejected by structural guards. Japanese kanji and Korean spelled-out counts retain six platform builds, one-to-two business days, twelve months and five examples without weakening the numeric guard. Finnish and Norwegian brand-inflection repairs retain the sampled privacy and liability meanings.

That review also identified a Japanese liability sentence that described a payment at a point twelve months before a claim instead of payments during the preceding twelve-month period. The targeted correction and two Korean grammatical repairs were applied and independently checked against the submitted replacements.

## Visible heading and hidden tooltip review

A rendered Japanese page revealed that preserved markup did not preserve semantic placement: “tools for” had moved into the hidden tooltip, leaving an incomplete visible headline. Review of the same hero key across all 49 non-English catalogs found the same class of defect in thirteen locales. Twenty targeted replacements restored visible heading content or corrected related grammatical attachment, overly literal tooltip wording and one validation term. All twenty were applied and independently checked against the reviewed replacements.

The final check validated all 50 complete catalogs and verified all 43 submitted locale/key corrections were present. This closes the independent review of the requested samples and implementation; it does not convert machine drafts into native-reviewed translations. Generation, full-site tests and deployment are separate release checks.

Future extraction should treat visible headings and hidden tooltip explanations as separate semantic units. Regression tests should compare the visible heading after excluding tooltip content, especially for the locales that exhibited this failure, while checking that the acronym button still reads GSD.
