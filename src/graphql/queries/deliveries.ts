import { gql } from '@apollo/client';

const DELIVERY_FIELDS = `
  id
  orderId
  driver
  vehicle
  destination
  scheduledDate
  startedAt
  deliveredAt
  status
  notes
  createdAt
  updatedAt
  order {
    id
    number
    customerName
    total
    customer { id name phone document address bairro cidade estado cep latitude longitude }
    items { productName quantity unitPrice total }
  }
`;

export const GET_DELIVERIES = gql`
  query GetDeliveries($search: String, $status: DeliveryStatus) {
    deliveries(search: $search, status: $status) {
      ${DELIVERY_FIELDS}
    }
  }
`;

export const GET_DELIVERY = gql`
  query GetDelivery($id: String!) {
    delivery(id: $id) {
      ${DELIVERY_FIELDS}
    }
  }
`;

export const GET_DELIVERIES_SUMMARY = gql`
  query GetDeliveriesSummary {
    deliveriesSummary {
      pending
      inTransit
      delivered
      canceled
      todayDelivered
    }
  }
`;

export const GET_DELIVERABLE_ORDERS = gql`
  query GetDeliverableOrders {
    deliverableOrders {
      id
      number
      customerName
      total
      createdAt
      customer {
        id
        name
        phone
        document
        address
        bairro
        cidade
        estado
        cep
        latitude
        longitude
      }
    }
  }
`;

export const CREATE_DELIVERY = gql`
  mutation CreateDelivery($input: CreateDeliveryInput!) {
    createDelivery(input: $input) {
      id
      orderId
      status
    }
  }
`;

export const UPDATE_DELIVERY = gql`
  mutation UpdateDelivery($input: UpdateDeliveryInput!) {
    updateDelivery(input: $input) {
      id
      status
      driver
      vehicle
      destination
      scheduledDate
      notes
    }
  }
`;

export const COMPLETE_DELIVERY = gql`
  mutation CompleteDelivery($id: String!, $notes: String) {
    completeDelivery(id: $id, notes: $notes) {
      id
      status
      deliveredAt
    }
  }
`;

export const CANCEL_DELIVERY = gql`
  mutation CancelDelivery($id: String!) {
    cancelDelivery(id: $id) {
      id
      status
    }
  }
`;
