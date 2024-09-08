export const CHAT_BASE_URL = 'http://localhost:8000';

export const UPLOAD_ENDPOINT = '/upload';
export const CHAT_ENDPOINT = '/chat';
if (!CHAT_BASE_URL) {
  console.warn('CHAT_BASE_URL is not set. Using default URL.');
}
