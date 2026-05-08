import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { VerificationStatus } from '../domain/model/verification-status.enum';

export interface EmailVerificationResource extends BaseResource {
  userId: number;
  email: string;
  status: VerificationStatus;
  expiresAt: string;
}

export interface EmailVerificationsResponse extends BaseResponse {
  emailVerifications: EmailVerificationResource[];
}
