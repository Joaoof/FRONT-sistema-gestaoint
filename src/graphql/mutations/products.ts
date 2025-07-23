import { gql } from '@apollo/client';

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
      category {
        id
        name
        color
      }
      costPrice
      sellingPrice
      stock
      minStock
      supplier {
        id
        name
      }
      active
      createdAt
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      description
      category {
        id
        name
        color
      }
      costPrice
      sellingPrice
      stock
      minStock
      supplier {
        id
        name
      }
      active
      updatedAt
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id) {
      success
      message
    }
  }
`;

export const UPDATE_PRODUCT_STOCK = gql`
  mutation UpdateProductStock($id: ID!, $stock: Int!) {
    updateProductStock(id: $id, stock: $stock) {
      id
      stock
      updatedAt
    }
  }
`;

export const TOGGLE_PRODUCT_STATUS = gql`
  mutation ToggleProductStatus($id: ID!) {
    toggleProductStatus(id: $id) {
      id
      active
      updatedAt
    }
  }
`;