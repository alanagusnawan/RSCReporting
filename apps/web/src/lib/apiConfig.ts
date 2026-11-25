/**
 * Helper untuk mendapatkan Base URL API NestJS secara dinamis mengikuti host browser.
 * Jika web diakses via IP LAN (mis. 172.16.0.34:3000), API otomatis ke http://172.16.0.34:5488
 */
/**
 * Helper untuk mendapatkan Base URL API NestJS secara dinamis mengikuti host browser.
 * Di web browser client, gunakan relative path '' agar request lewat Next.js proxy rewrite.
 * Bebas masalah CORS, SSL/Mixed-Content, dan blokir port.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Di browser client: panggil relative path (proxy lewat Next.js port 5499)
    return '';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5488';
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
