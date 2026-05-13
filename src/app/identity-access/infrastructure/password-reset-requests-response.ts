import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { PasswordResetStatus } from '../domain/model/password-reset-status.enum';

/**
 * @summary Raw password reset request resource from the ColdTrace API.
 */
export interface PasswordResetRequestResource extends BaseResource {
  userId: number;
  email: string;
  status: PasswordResetStatus;
  expiresAt: string;
}

/**
 * @summary Raw response from the ColdTrace API for password reset requests.
 */
export interface PasswordResetRequestsResponse extends BaseResponse {
  passwordResetRequests: PasswordResetRequestResource[];
}
