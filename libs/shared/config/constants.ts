export const CHAT_BASE_URL = 
  typeof process !== 'undefined' && process.env.CHAT_BASE_URL 
  || typeof window !== 'undefined' && (window as any).CHAT_BASE_URL
  || 'https://devchat.firstchatbi.com';

export const UPLOAD_ENDPOINT = '/upload';
export const CHAT_ENDPOINT = '/chat';
// website
export const SCRAPING_ENDPOINT = '/scraping'; // Add scraping endpoint
export const TASK_STATE_ENDPOINT = '/task_state'; // Add task state endpoint
// sql


if (!CHAT_BASE_URL) {
  console.warn('CHAT_BASE_URL is not set. Using default URL.');
}
