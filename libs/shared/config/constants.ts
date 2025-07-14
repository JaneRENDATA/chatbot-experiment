export const CHAT_BASE_URL = process.env.NEXT_PUBLIC_CHAT_BASE_URL || '';
export const CHAT_ENDPOINT = '/chat';
export const UPLOAD_ENDPOINT = '/upload';
export const SCRAPING_ENDPOINT = '/scraping';
export const TASK_STATE_ENDPOINT = '/task_state';

if (!CHAT_BASE_URL) {
  console.warn('CHAT_BASE_URL is not set. Using relative path.');
}
