import { gql } from "@apollo/client"

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      user {
        id
        email
        name
        companyId
        role
      }
      company {
        id
        name
        modules {
          moduleId
          permissions {
            action
            resource
          }
          isActive
        }
        settings {
          theme
          features
          limits {
            maxProducts
            maxUsers
          }
        }
      }
      token
    }
  }
`

export const GET_COMPANY_QUERY = gql`
  query GetCompany($token: String!) {
    currentUser(token: $token) {
      id
      email
      name
      companyId
      role
    }
  }
`
