let apiRoot = ''

if (import.meta.env.MODE === 'production') {
  apiRoot = ''
}
if (import.meta.env.MODE === 'development') {
  apiRoot = 'http://localhost:8017'
}

export const API_ROOT = apiRoot

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEMS_PER_PAGE = 12

export const USER_ROLE = {
  DOCTOR: "doctor",
  PATIENT: "patient"
}
