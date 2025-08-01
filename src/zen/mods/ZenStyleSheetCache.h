/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef mozilla_ZenStyleSheetCache_h__
#define mozilla_ZenStyleSheetCache_h__

#include "mozilla/css/Loader.h"
#include "mozilla/NotNull.h"
#include "mozilla/StaticPtr.h"

#ifndef ZEN_MODS_FILENAME
  #define ZEN_MODS_FILENAME u"zen-themes.css"_ns
#endif

namespace zen {

class ZenStyleSheetCache final : public nsISupports {
  using StyleSheet = mozilla::StyleSheet;

 public:
  NS_DECL_ISUPPORTS

  /**
   * @brief Get the mods stylesheet.
   * This is called when we need to get the mods stylesheets.
   * @returns The mods stylesheet.
   */
  auto GetModsSheet() -> StyleSheet*;

  /**
   * @brief Rebuild the mods stylesheets.
   * This is re-parses the mods stylesheet and applies it to all
   * the connected documents.
   * @param aContents The contents of the mods stylesheet.
   * @returns NS_OK on success, or an error code on failure.
   */
  nsresult RebuildModsStylesheets(const nsACString& aContents);

  static auto Singleton() -> ZenStyleSheetCache*;
 private:
  ZenStyleSheetCache() = default;
  ~ZenStyleSheetCache() = default;

  /**
   * @brief Load the stylesheet from the given file.
   * @param aFile The file to load the stylesheet from.
   */
  auto LoadSheetFile(nsIFile* aFile, mozilla::css::SheetParsingMode aParsingMode)
      -> void;

  static mozilla::StaticRefPtr<ZenStyleSheetCache> gZenModsCache;

  RefPtr<StyleSheet> mModsSheet;
};

} // namespace zen

#endif
