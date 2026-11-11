// Craftware (Örninn FEAT-263): full category path labels for the "Assign Category" modal and the
// reference-attribute chips. The same category name ("Shirts", "Accessories") exists under every
// shop's tree, so the bare name can't tell them apart — the path can.

export const CATEGORY_PATH_SEPARATOR = " / ";

interface PathNode {
  name: string;
  level: number;
}

export interface CategoryWithPath {
  name: string;
  fullPath?: {
    edges: Array<{ node: PathNode }>;
  } | null;
}

/**
 * Ancestor names from the root down to the direct parent.
 *
 * Sorted by `level` rather than trusting response order: Saleor can return `ancestors` in ID order
 * after a category has been re-parented, which would scramble the path.
 */
export const getCategoryAncestorNames = (category: CategoryWithPath): string[] =>
  [...(category.fullPath?.edges ?? [])]
    .map(edge => edge.node)
    .sort((a, b) => a.level - b.level)
    .map(node => node.name);

/** "Root / Parent / " — empty for a root category or when the path wasn't fetched. */
export const getCategoryPathPrefix = (category: CategoryWithPath): string => {
  const names = getCategoryAncestorNames(category);

  return names.length ? `${names.join(CATEGORY_PATH_SEPARATOR)}${CATEGORY_PATH_SEPARATOR}` : "";
};

/** "Root / Parent / Name" — just "Name" for a root category or when the path wasn't fetched. */
export const getCategoryPathLabel = (category: CategoryWithPath): string =>
  `${getCategoryPathPrefix(category)}${category.name}`;
