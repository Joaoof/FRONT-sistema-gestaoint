import { gql } from '@apollo/client';
import { PRODUCT_CORE_FRAGMENT, SELLER_CORE_FRAGMENT } from '../fragments/salesManagement';

export const LIST_SELLERS_QUERY = gql`
  ${SELLER_CORE_FRAGMENT}
  query ListSellers {
    sellers {
      ...SellerCore
      commissionTotal
      scoreTotal
    }
  }
`;

export const LIST_PRODUCTS_QUERY = gql`
  ${PRODUCT_CORE_FRAGMENT}
  query ListProducts {
    products {
      ...ProductCore
    }
  }
`;

export const LIST_SALES_QUERY = gql`
  query ListSales {
    sales {
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

export const SELLER_METRICS_QUERY = gql`
  query SellerMetrics {
    sellerMetrics {
      sellerId
      sellerName
      commissionTotal
      scoreTotal
    }
  }
`;
