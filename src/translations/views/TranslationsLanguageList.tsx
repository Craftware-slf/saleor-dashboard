// @ts-strict-ignore
import useShop from "@dashboard/hooks/useShop";

import { maybe } from "../../misc";
import TranslationsLanguageListPage from "../components/TranslationsLanguageListPage";
import { filterEnabledLanguages } from "../enabledLanguages";

const TranslationsLanguageList = () => {
  const shop = useShop();

  // Saleor's shop.languages is the full LanguageCodeEnum (~779); show only the
  // languages the store uses (see enabledLanguages.ts), matching the picker.
  return (
    <TranslationsLanguageListPage
      languages={filterEnabledLanguages(maybe(() => shop.languages, []))}
    />
  );
};

TranslationsLanguageList.displayName = "TranslationsLanguageList";
export default TranslationsLanguageList;
