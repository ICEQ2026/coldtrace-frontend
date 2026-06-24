import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = join(projectRoot, 'public', 'config', 'oauth.config.json');

const oauthConfig = {
  googleOAuthClientId: readEnv('GOOGLE_OAUTH_CLIENT_ID'),
  appleOAuthClientId: readEnv('APPLE_OAUTH_CLIENT_ID'),
  appleOAuthRedirectUri: readEnv('APPLE_OAUTH_REDIRECT_URI'),
};

if (Object.values(oauthConfig).some(Boolean) || !existsSync(outputPath)) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(oauthConfig, null, 2)}\n`);
  console.log('Generated public/config/oauth.config.json');
} else {
  console.log('Using existing public/config/oauth.config.json');
}

function readEnv(name) {
  return process.env[name]?.trim() ?? '';
}
