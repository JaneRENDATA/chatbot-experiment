export const CHAT_BASE_URL = 'http://localhost:4000';

export const UPLOAD_ENDPOINT = '/upload';
export const CHAT_ENDPOINT = '/chat';
// website
export const SCRAPING_ENDPOINT = '/scraping'; // Add scraping endpoint
export const TASK_STATE_ENDPOINT = '/task_state'; // Add task state endpoint
// sql


if (!CHAT_BASE_URL) {
  console.warn('CHAT_BASE_URL is not set. Using default URL.');
}
