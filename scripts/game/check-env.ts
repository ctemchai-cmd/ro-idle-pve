import { loadEnv } from 'vite';
import { readPublicAuthConfig } from '../../src/client/auth-config.ts';
import { validateBuildEnvironment } from './validate-env.ts';
const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const issue = validateBuildEnvironment(env);
if (issue) throw new Error(issue);
const config = readPublicAuthConfig(env);
if (config.kind === 'invalid') throw new Error(config.code);
console.log(JSON.stringify({ public_auth_config: config.kind, privileged_values_logged: false }));
