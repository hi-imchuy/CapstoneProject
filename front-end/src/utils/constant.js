import { env } from "./environment"
let apiRoot = ''

if (import.meta.env.MODE === 'production') {
  apiRoot = env.WEBSITE_DOMAIN_PRODUCTION
}
if (import.meta.env.MODE === 'development') {
  apiRoot = env.WEBSITE_DOMAIN_DEVELOPMENT
}

export const API_ROOT = apiRoot

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEMS_PER_PAGE = 12

export const USER_ROLE = {
  DOCTOR: "doctor",
  PATIENT: "patient"
}
