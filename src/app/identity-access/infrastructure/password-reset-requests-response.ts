import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { PasswordResetStatus } from '../domain/model/password-reset-status.enum';

export interface PasswordResetRequestResource extends BaseResource {
  userId: number;
  email: string;
  status: PasswordResetStatus;
  expiresAt: string;
}

export interface PasswordResetRequestsResponse extends BaseResponse {
  passwordResetRequests: PasswordResetRequestResource[];
}
