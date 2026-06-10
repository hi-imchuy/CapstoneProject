// Note: dotenv is not needed in frontend (browser environment)
// Vite automatically loads .env files and exposes them via import.meta.env
// Variables must be prefixed with VITE_ to be accessible in client-side code

export const env = {
  API_ROOT_DEVELOPMENT: import.meta.env.VITE_API_ROOT_DEVELOPMENT,
  API_ROOT_PRODUCTION: import.meta.env.VITE_API_ROOT_PRODUCTION,
  WEBSITE_DOMAIN_DEVELOPMENT: import.meta.env.VITE_WEBSITE_DOMAIN_DEVELOPMENT,
  WEBSITE_DOMAIN_PRODUCTION: import.meta.env.VITE_WEBSITE_DOMAIN_PRODUCTION
}
