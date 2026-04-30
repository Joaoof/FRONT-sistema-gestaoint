import { gql } from '@apollo/client';

/**
 * Mutation alinhada ao módulo Product do backend (NestJS + Prisma + R2).
 * O frontend faz upload das imagens primeiro via /api/storage/sign (presigned URL)
 * e envia aqui apenas as URLs/keys já persistidas no R2.
 */
export const CREATE_PRODUCT_WITH_IMAGES = gql`
  mutation CreateProductMutation($input: CreateProductInput!) {
    createProductMutation(input: $input) {
      id
      sku
      nameProduct
      unit
      quantity
      minStock
      weight
      costPrice
      salePrice
      status
      categoryId
      supplierId
      description
      images {
        id
        url
        key
        isPrimary
        order
      }
      createdAt
      updatedAt
    }
  }
`;

export const LIST_PRODUCTS_WITH_IMAGES = gql`
  query ListProducts($search: String, $categoryId: String, $take: Float, $skip: Float) {
    products(search: $search, categoryId: $categoryId, take: $take, skip: $skip) {
      id
      sku
      nameProduct
      quantity
      minStock
      unit
      costPrice
      salePrice
      status
      images {
        id
        url
        isPrimary
        order
      }
      createdAt
    }
  }
`;

export const DELETE_PRODUCT_WITH_IMAGES = gql`
  mutation DeleteProductMutation($id: String!) {
    deleteProductMutation(id: $id)
  }
`;
