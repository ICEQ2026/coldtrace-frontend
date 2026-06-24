import { Injectable } from '@angular/core';

export interface OAuthRuntimeConfig {
  googleOAuthClientId: string;
  appleOAuthClientId: string;
  appleOAuthRedirectUri: string;
}

const oauthRuntimeConfigUrl = './config/oauth.config.json';

const emptyOAuthRuntimeConfig: OAuthRuntimeConfig = {
  googleOAuthClientId: '',
  appleOAuthClientId: '',
  appleOAuthRedirectUri: '',
};

@Injectable({ providedIn: 'root' })
export class OAuthRuntimeConfigService {
  private configLoading?: Promise<OAuthRuntimeConfig>;

  load(): Promise<OAuthRuntimeConfig> {
    this.configLoading ??= fetch(oauthRuntimeConfigUrl, { cache: 'no-store' })
      .then((response) =>
        response.ok ? (response.json() as Promise<Partial<OAuthRuntimeConfig>>) : {},
      )
      .then((config) => this.normalizeConfig(config))
      .catch(() => emptyOAuthRuntimeConfig);

    return this.configLoading;
  }

  private normalizeConfig(config: Partial<OAuthRuntimeConfig>): OAuthRuntimeConfig {
    return {
      googleOAuthClientId: this.normalizeValue(config.googleOAuthClientId),
      appleOAuthClientId: this.normalizeValue(config.appleOAuthClientId),
      appleOAuthRedirectUri: this.normalizeValue(config.appleOAuthRedirectUri),
    };
  }

  private normalizeValue(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }
}
