/**
 * Helper untuk mendapatkan Base URL API NestJS secara dinamis mengikuti host browser.
 * Jika web diakses via IP LAN (mis. 172.16.0.34:3000), API otomatis ke http://172.16.0.34:5488
 */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname || 'localhost';
    return `${protocol}//${hostname}:5488`;
  }
  return 'http://localhost:5488';
}

export function getWsBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname || 'localhost';
    return `${protocol}//${hostname}:5488/agent/ws`;
  }
  return 'ws://localhost:5488/agent/ws';
}
