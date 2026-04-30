import { gql } from '@apollo/client';

export const SELLER_CORE_FRAGMENT = gql`
  fragment SellerCore on Seller {
    id
    name
    email
  }
`;

export const PRODUCT_CORE_FRAGMENT = gql`
  fragment ProductCore on Product {
    id
    name
    sku
    price
  }
`;
