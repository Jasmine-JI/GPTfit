/**
 * api response resultCode 定義
 */
export enum ResultCode {
  success = 200,
  failed = 400,
  tokenError = 401,
  tokenExpired = 402,
  forbidden = 403,
  pageNotFound = 404,
  conflict = 409,
}
