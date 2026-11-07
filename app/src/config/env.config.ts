export const ENV = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost:3000'),
  UNAM_LOGO: process.env.UNAM_LOGO || '',
  GOOGLE_CLIENT_ID:
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '20191593425-enqgc95a8cpltaeimpolhb2fmb4hutde.apps.googleusercontent.com',
};
