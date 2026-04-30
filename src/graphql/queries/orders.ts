import { gql } from '@apollo/client';

const ORDER_FIELDS = `
  id
  number
  customerId
  customerName
  customerDocument
  customerPhone
  sellerId
  sellerName
  commissionPercent
  commissionAmount
  status
  paymentMethod
  subtotal
  discount
  total
  notes
  createdAt
  updatedAt
  customer { id name document email phone address bairro cep }
  items {
    id
    productId
    productName
    quantity
    unitPrice
    discount
    total
  }
`;

export const GET_ORDERS = gql`
  query GetOrders($search: String, $status: OrderStatus) {
    orders(search: $search, status: $status) {
      ${ORDER_FIELDS}
    }
  }
`;

export const GET_ORDER = gql`
  query GetOrder($id: String!) {
    order(id: $id) {
      ${ORDER_FIELDS}
    }
  }
`;

export const GET_ORDERS_SUMMARY = gql`
  query GetOrdersSummary {
    ordersSummary {
      todayCount
      todayTotal
      monthCount
      monthTotal
    }
  }
`;

export const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      number
      total
      status
      paymentMethod
      createdAt
      items { id productId productName quantity unitPrice total }
    }
  }
`;

export const CANCEL_ORDER = gql`
  mutation CancelOrder($id: String!) {
    cancelOrder(id: $id) {
      id status
    }
  }
`;

export const DELETE_ORDER = gql`
  mutation DeleteOrder($id: String!) {
    deleteOrder(id: $id)
  }
`;
