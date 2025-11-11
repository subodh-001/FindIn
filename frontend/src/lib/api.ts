const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export function apiFetch(input: string, init?: RequestInit) {
  const url = input.startsWith('http') ? input : `${API_BASE_URL}${input}`;
  return fetch(url, init);
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

