import { parse } from "qs";

// `before`/`after` are the list's pagination cursors, and a Saleor cursor is only valid for
// the sort order it was captured under. `sort`/`asc` are dropped here, so keeping the cursor
// left a preset carrying a position with nothing to interpret it: save a filtered list from
// page 2 under a non-default sort and Saleor answers "Received cursor is invalid." — the list
// blanks on save and every reopen of the preset is empty, with the filter still showing as
// applied (FEAT-145). A saved search should reopen at the start of the list anyway.
const paramsToRemove = ["activeTab", "action", "sort", "asc", "before", "after"];

export const prepareQs = (searchQuery: string) => {
  const parsedQs = parse(searchQuery.startsWith("?") ? searchQuery.slice(1) : searchQuery);
  const activeTab = parsedQs.activeTab;

  paramsToRemove.forEach(param => {
    delete parsedQs[param];
  });

  return {
    activeTab,
    parsedQs,
  };
};
