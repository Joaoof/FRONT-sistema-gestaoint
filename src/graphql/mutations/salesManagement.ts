import { gql } from '@apollo/client';
import { PRODUCT_CORE_FRAGMENT, SELLER_CORE_FRAGMENT } from '../fragments/salesManagement';

export const CREATE_SELLER_MUTATION = gql`
  ${SELLER_CORE_FRAGMENT}
  mutation CreateSeller($input: CreateSellerInput!) {
    createSeller(input: $input) {
      ...SellerCore
      commissionTotal
      scoreTotal
    }
  }
`;

export const CREATE_PRODUCT_MUTATION = gql`
  ${PRODUCT_CORE_FRAGMENT}
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      ...ProductCore
    }
  }
`;

export const REGISTER_SALE_MUTATION = gql`
  mutation RegisterSale($input: RegisterSaleInput!) {
    registerSale(input: $input) {
      id
      quantity
      soldAt
      seller {
        id
        name
      }
      product {
        id
        name
        price
      }
    }
  }
`;
