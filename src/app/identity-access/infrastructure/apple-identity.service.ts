import { Injectable, inject } from '@angular/core';
import { SocialTokenExchangeRequest } from './authentication-response';
import { OAuthRuntimeConfigService } from './oauth-runtime-config.service';

interface AppleAuthorizationResponse {
  authorization?: {
    code?: string;
    id_token?: string;
  };
  user?: {
    email?: string;
    name?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

interface AppleAuth {
  init(configuration: {
    clientId: string;
    scope: string;
    redirectURI: string;
    state: string;
    nonce: string;
    usePopup: boolean;
  }): void;
  signIn(): Promise<AppleAuthorizationResponse>;
}

export interface AppleIdentityCredential extends SocialTokenExchangeRequest {
  email?: string;
  fullName?: string;
}

declare global {
  interface Window {
    AppleID?: {
      auth?: AppleAuth;
    };
  }
}

/**
 * @summary Loads Apple JS and starts the Sign in with Apple popup flow.
 */
@Injectable({ providedIn: 'root' })
export class AppleIdentityService {
  private readonly oauthRuntimeConfig = inject(OAuthRuntimeConfigService);
  private scriptLoading?: Promise<void>;

  signIn(
    onCredential: (credential: AppleIdentityCredential) => void,
    onUnavailable: () => void,
  ): void {
    void this.startSignIn(onCredential, onUnavailable).catch(() => onUnavailable());
  }

  private async startSignIn(
    onCredential: (credential: AppleIdentityCredential) => void,
    onUnavailable: () => void,
  ): Promise<void> {
    const { appleOAuthClientId, appleOAuthRedirectUri } = await this.oauthRuntimeConfig.load();

    if (!appleOAuthClientId || !appleOAuthRedirectUri) {
      onUnavailable();
      return;
    }

    const nonce = this.createNonce();
    await this.loadScript();

    const appleAuth = window.AppleID?.auth;

    if (!appleAuth) {
      onUnavailable();
      return;
    }

    appleAuth.init({
      clientId: appleOAuthClientId,
      scope: 'name email',
      redirectURI: appleOAuthRedirectUri,
      state: 'coldtrace-social-auth',
      nonce,
      usePopup: true,
    });

    const response = await appleAuth.signIn();
    const authorizationCode = response.authorization?.code?.trim();
    const idToken = response.authorization?.id_token?.trim();

    if (!authorizationCode && !idToken) {
      onUnavailable();
      return;
    }

    onCredential({
      ...(idToken ? { idToken } : {}),
      ...(authorizationCode ? { authorizationCode } : {}),
      redirectUri: appleOAuthRedirectUri,
      nonce,
      ...this.getUserProfile(response),
    });
  }

  private loadScript(): Promise<void> {
    if (window.AppleID?.auth) {
      return Promise.resolve();
    }

    if (this.scriptLoading) {
      return this.scriptLoading;
    }

    this.scriptLoading = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"]',
      );

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src =
        'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });

    return this.scriptLoading;
  }

  private getUserProfile(
    response: AppleAuthorizationResponse,
  ): Pick<AppleIdentityCredential, 'email' | 'fullName'> {
    const email = response.user?.email?.trim().toLowerCase();
    const fullName = [response.user?.name?.firstName?.trim(), response.user?.name?.lastName?.trim()]
      .filter(Boolean)
      .join(' ');

    return {
      ...(email ? { email } : {}),
      ...(fullName ? { fullName } : {}),
    };
  }

  private createNonce(): string {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
}
