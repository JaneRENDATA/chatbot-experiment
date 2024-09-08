export interface IApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface IUploadResponseData {
  lib_id: string;
}

export type UploadResponse = IApiResponse<IUploadResponseData>;