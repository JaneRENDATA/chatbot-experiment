import { CHAT_BASE_URL, CHAT_ENDPOINT } from '../../../../libs/shared/config/constants';

interface ChatMessage {
  role: string;
  content: string;
}

export const chatWithAI = async (libId: string, messages: ChatMessage[]): Promise<ReadableStream> => {

  // to print msgs.
  console.log('Chat messages:', JSON.stringify(messages));

  const response = await fetch(`${CHAT_BASE_URL}${CHAT_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ lib_id: libId, messages }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return response.body as ReadableStream;
};