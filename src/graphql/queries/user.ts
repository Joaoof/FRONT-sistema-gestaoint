export const GET_USER_QUERY = `
  query Me {
  me {
    id
    name
    email
    phone
    avatarUrl
    role
    company_id
    plan {
      name
      modules {
        module_key
        permission
      }
    }
    permissions {
      module_key
      permissions
    }
  }
}
`;

export const UPDATE_MY_PROFILE_MUTATION = `
  mutation UpdateMyProfile($input: UpdateProfileInput!) {
    updateMyProfile(input: $input) {
      id
      name
      email
      phone
      avatarUrl
      role
      company_id
    }
  }
`;

// src/graphql/mutations/login.graphql.ts

export const LOGIN_MUTATION = `
  mutation Login($loginUserInput: LoginUserInput!) {
    login(loginUserInput: $loginUserInput) {
    accessToken
    expiresIn
    user {
      id
      name
      email
      role
      company_id  # ✅
      company {
        id
        name
        email
        phone
        address
      }
      plan {
        name
        description
        modules {
          module_key
          name
          description
          permission
          isActive
        }
      }
    }
  }
  }
`;