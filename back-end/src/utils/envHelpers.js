import { env } from '~/config/environment'

const normalizeUrl = (url) => (url || '').replace(/\/$/, '')

export const getWebsiteDomain = () => {
  const modeUrl = env.BUILD_MODE === 'production'
    ? env.WEBSITE_DOMAIN_PRODUCTION
    : env.WEBSITE_DOMAIN_DEVELOPMENT

  return normalizeUrl(modeUrl || env.WEBSITE_DOMAIN_DEVELOPMENT || env.WEBSITE_DOMAIN_PRODUCTION)
}

export const getPythonServerUrl = () => {
  const modeUrl = env.BUILD_MODE === 'production'
    ? env.PYTHON_SERVER_URL_PRODUCTION
    : env.PYTHON_SERVER_URL_DEVELOPMENT

  return normalizeUrl(modeUrl || env.PYTHON_SERVER_URL || 'http://localhost:8000')
}
