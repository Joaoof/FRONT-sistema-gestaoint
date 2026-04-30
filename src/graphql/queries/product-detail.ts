import { gql } from '@apollo/client';

export const GET_PRODUCT_DETAIL = gql`
  query GetProductDetail($id: String!) {
    product(id: $id) {
      id
      sku
      nameProduct
      quantity
      minStock
      unit
      weight
      costPrice
      salePrice
      status
      categoryId
      supplierId
      description
      images { id url isPrimary order }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PRODUCT_DETAIL = gql`
  mutation UpdateProductDetail($input: UpdateProductInput!) {
    updateProductMutation(input: $input) {
      id
      sku
      nameProduct
      quantity
      minStock
      unit
      weight
      costPrice
      salePrice
      status
      description
      images { id url isPrimary order }
      updatedAt
    }
  }
`;
