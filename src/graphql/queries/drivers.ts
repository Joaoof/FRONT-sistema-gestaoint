import { gql } from '@apollo/client';

const DRIVER_FIELDS = `
  id
  name
  photoUrl
  cnh
  cnhCategory
  phone
  document
  vehicle
  vehiclePlate
  active
  totalDeliveries
  notes
  createdAt
  updatedAt
`;

export const GET_DRIVERS = gql`
  query GetDrivers($search: String, $activeOnly: Boolean) {
    drivers(search: $search, activeOnly: $activeOnly) {
      ${DRIVER_FIELDS}
    }
  }
`;

export const GET_DRIVER = gql`
  query GetDriver($id: String!) {
    driver(id: $id) {
      ${DRIVER_FIELDS}
    }
  }
`;

export const CREATE_DRIVER = gql`
  mutation CreateDriver($input: CreateDriverInput!) {
    createDriver(input: $input) {
      ${DRIVER_FIELDS}
    }
  }
`;

export const UPDATE_DRIVER = gql`
  mutation UpdateDriver($id: String!, $input: UpdateDriverInput!) {
    updateDriver(id: $id, input: $input) {
      ${DRIVER_FIELDS}
    }
  }
`;

export const DELETE_DRIVER = gql`
  mutation DeleteDriver($id: String!) {
    deleteDriver(id: $id)
  }
`;
