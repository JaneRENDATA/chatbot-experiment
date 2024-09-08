import axios from 'axios';
import { CHAT_BASE_URL } from '../../../../libs/shared/config/constants';

const instance = axios.create({
  baseURL: CHAT_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const http = {
  post: <T>(url: string, data: FormData): Promise<T> => {
    return instance.post<T>(url, data).then((response) => response.data);
  },
};