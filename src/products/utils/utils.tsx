import { mapEdgesToItems } from "@dashboard/utils/maps";
import { type Option, Text } from "@saleor/macaw-ui-next";

type Choice = {
  id: string;
  name: string;
};

export type ChoiceWithAncestors = Choice & {
  ancestors: {
    edges: {
      node: Choice;
    }[];
  };
  level: number;
  parent: {
    id: string;
    name: string;
  } | null;
};

const getAncestorsLabel = (choice: ChoiceWithAncestors): string => {
  const { parent, level, ancestors } = choice;

  if (level === 0) {
    return "";
  }

  if (level === 1) {
    return `${parent?.name} / ` || "";
  }

  const ancestor = mapEdgesToItems(ancestors)?.[0];

  const parentLabel = parent?.name ?? null;
  const rootCategoryLabel = ancestor?.name || null;

  return `${rootCategoryLabel} ${level > 2 ? "/ ... /" : "/"} ${parentLabel} / `;
};

/**
 * Craftware: the same options, keyed by category SLUG instead of id (Örninn FEAT-185).
 *
 * The per-store category override is stored in product metadata as a slug, because that is what
 * Örninn's search indexer and storefronts read. Everything else in the dashboard keys categories
 * by id, so this deliberately does NOT change `getChoicesWithAncestors` — mixing the two is the
 * easiest way to produce a control that looks right and writes an unusable value.
 */
export const getChoicesWithAncestorsBySlug = (
  choices: Array<ChoiceWithAncestors & { slug: string }>,
): Option[] =>
  getChoicesWithAncestors(choices).map((option, index) => ({
    ...option,
    value: choices[index].slug,
  }));

export const getChoicesWithAncestors = (choices: ChoiceWithAncestors[]): Option[] =>
  choices.map(category => {
    const hasAncestors = category.level > 0;

    return {
      value: category.id,
      label: category.name,
      startAdornment: hasAncestors ? (
        <Text
          size={2}
          color="default2"
          key={`ancestor-${category.id}`}
          __display="inline"
          height="100%"
          alignItems="center"
        >
          {getAncestorsLabel(category)}
        </Text>
      ) : undefined,
    };
  });
