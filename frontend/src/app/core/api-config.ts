/**
 * Configuración dinámica de la URL base del Backend RoomiGo API.
 * - Entorno Local (localhost / 127.0.0.1): 'http://localhost:8081/api/v1'
 * - Producción / Vercel: '/api/v1' (enrutado transparentemente vía vercel.json rewrite hacia Render sin problemas de CORS ni HTTPS)
 * - Soporta sobreescritura manual mediante window.__ROOMIX_API_URL__ o localStorage.getItem('ROOMIX_API_URL')
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = (window as any).__ROOMIX_API_URL__ || localStorage.getItem('ROOMIX_API_URL');
    if (custom) {
      return custom.replace(/\/+$/, '');
    }

    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // En Vercel o dominio externo, usamos ruta relativa '/api/v1'
      // que vercel.json redirige a https://backendroomigo.onrender.com/api/v1
      return '/api/v1';
    }
  }

  return 'http://localhost:8081/api/v1';
}
