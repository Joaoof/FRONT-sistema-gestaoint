import { gql } from '@apollo/client';

export const GET_CATEGORIES = gql`
  query GetCategories($pagination: PaginationInput, $filters: CategoryFiltersInput) {
    categories(pagination: $pagination, filters: $filters) {
      items {
        id
        name
        description
        color
        active
        createdAt
        updatedAt
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const GET_CATEGORY_BY_ID = gql`
  query GetCategoryById($id: ID!) {
    category(id: $id) {
      id
      name
      description
      color
      active
      createdAt
      updatedAt
    }
  }
`;

export const GET_ACTIVE_CATEGORIES = gql`
  query GetActiveCategories {
    activeCategories {
      id
      name
      color
    }
  }
`;