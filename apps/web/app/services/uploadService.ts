import { http } from '../utils/http';
import { UPLOAD_ENDPOINT } from '../../../../libs/shared/config/constants';
import { UploadResponse } from '../models/api';

export const uploadDocument = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  return http.post<UploadResponse>(UPLOAD_ENDPOINT, formData);
};