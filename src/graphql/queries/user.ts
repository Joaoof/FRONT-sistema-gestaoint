export const GET_USER_QUERY = `
  query GetUser {
    me {
      id
      name
      email
      role
      company_id
    }
  }
`;