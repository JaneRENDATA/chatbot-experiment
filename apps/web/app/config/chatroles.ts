/* eslint-disable @typescript-eslint/naming-convention */


// data_scientist
// customer_support
// smart_product_assistant

// Roles
export const ChatRoles = {
  DATA_SCIENTIST: 'data_scientist',
  CUSTOMER_SUPPORT: 'customer_support',
  SMART_PRODUCT_ASSISTANT: 'smart_product_assistant',
} as const;

export type ChatRole = typeof ChatRoles[keyof typeof ChatRoles];

