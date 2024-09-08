import { CHAT_BASE_URL, CHAT_ENDPOINT } from '../../../../libs/shared/config/constants';

export const chatWithAI = async (libId: string, message: string): Promise<ReadableStream> => {
  const response = await fetch(`${CHAT_BASE_URL}${CHAT_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ lib_id: libId, message }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return response.body as ReadableStream;
};