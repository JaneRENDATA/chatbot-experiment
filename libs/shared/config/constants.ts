export const CHAT_BASE_URL = 
  typeof process !== 'undefined' && process.env.CHAT_BASE_URL 
  || typeof window !== 'undefined' && (window as any).CHAT_BASE_URL
  || 'https://chat-production-a125.up.railway.app';

export const UPLOAD_ENDPOINT = '/upload';
export const CHAT_ENDPOINT = '/chat';
if (!CHAT_BASE_URL) {
  console.warn('CHAT_BASE_URL is not set. Using default URL.');
}
