import { gql } from "@apollo/client";

export const categoryFragment = gql`
  fragment Category on Category {
    id
    name
    children {
      totalCount
    }
    products {
      totalCount
    }
  }
`;
export const categoryDetailsFragment = gql`
  fragment CategoryDetails on Category {
    id
    ...Metadata
    backgroundImage {
      alt
      url
    }
    name
    slug
    description
    seoDescription
    seoTitle
    parent {
      id
    }
    ancestors(first: 100) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

export const categoryWithAncestorFragment = gql`
  fragment CategoryWithAncestors on Category {
    id
    name
    slug
    parent {
      id
      name
    }
    level
    ancestors(first: 1) {
      edges {
        node {
          id
          name
        }
      }
    }
    # Craftware (Örninn FEAT-263): full path for every category picker
    ...CategoryPath
  }
`;

// Craftware (Örninn FEAT-263): every ancestor, with its level, so every category picker can show
// the full path ("Root / Parent / Name", no "..."). Aliased so it can sit next to the
// `ancestors(first: 1)` some selection sets already have without changing that field.
// `level` is fetched because Saleor can return ancestors in ID order after a re-parent; callers sort.
export const categoryPathFragment = gql`
  fragment CategoryPath on Category {
    id
    name
    level
    fullPath: ancestors(first: 50) {
      edges {
        node {
          id
          name
          level
        }
      }
    }
  }
`;

export const categoryWithTotalProductsFragment = gql`
  fragment CategoryWithTotalProducts on Category {
    id
    name
    products {
      totalCount
    }
  }
`;
