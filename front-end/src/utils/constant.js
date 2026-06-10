import { env } from "./environment"

const normalizeUrl = (url) => (url || '').replace(/\/$/, '')

const apiRootByMode = {
  production: env.API_ROOT_PRODUCTION,
  development: env.API_ROOT_DEVELOPMENT
}

const apiRoot = normalizeUrl(apiRootByMode[import.meta.env.MODE] || apiRootByMode.development)

export const API_ROOT = apiRoot

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEMS_PER_PAGE = 12

export const USER_ROLE = {
  DOCTOR: "doctor",
  PATIENT: "patient"
}
