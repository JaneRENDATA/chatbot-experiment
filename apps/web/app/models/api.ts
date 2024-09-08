export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface UploadResponseData {
  lib_id: string;
}

export type UploadResponse = ApiResponse<UploadResponseData>;