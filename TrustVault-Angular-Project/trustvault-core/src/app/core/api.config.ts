/** Base URL of the API.
 *  USE_MOCK = true  -> the in-app mock backend (an HTTP interceptor) answers every /api call. No server needed.
 *  USE_MOCK = false -> requests go to a real server: set API_URL to e.g. 'https://your-api.example.com/api'.
 *  The full list of endpoints is documented in API.md. */
export const USE_MOCK = true;
export const API_URL = '/api';
export const TOKEN_KEY = 'tv_token';
