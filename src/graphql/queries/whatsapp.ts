import { gql } from '@apollo/client';

export const BUILD_WHATSAPP_LINK = gql`
  mutation BuildWhatsappLink($input: BuildWhatsappLinkInput!) {
    buildWhatsappLink(input: $input) {
      url
      body
      toAddress
      messageLogId
    }
  }
`;

export const MARK_WHATSAPP_LINK_OPENED = gql`
  mutation MarkWhatsappLinkOpened($messageLogId: String!) {
    markWhatsappLinkOpened(messageLogId: $messageLogId)
  }
`;
