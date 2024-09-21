import { SCRAPING_ENDPOINT, CHAT_BASE_URL } from '../../../../libs/shared/config/constants';

export const scrapeWebsite = async (url: string) => {
  const response = await fetch(`${CHAT_BASE_URL}${SCRAPING_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error('Failed to initiate scraping');
  }

  return response.json();
};
