/**
 * Proxy del servidor de desarrollo (ng serve): reenvía /api al backend local.
 *
 * Permite exponer TODA la app por un solo túnel (ngrok → puerto 4200), necesario para probar
 * Mercado Pago: el comprador vuelve al frontend y el webhook llega a /api/v1/... por el mismo dominio.
 *
 * Se quita la cabecera Origin porque, vista desde el navegador, la petición es del mismo origen
 * (el dominio del túnel); así no hace falta abrir CORS del backend a dominios de ngrok.
 * Solo afecta a desarrollo: en producción Vercel reenvía /api a Render (ver vercel.json).
 */
export default {
  '/api': {
    target: 'http://localhost:8081',
    secure: false,
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'));
    }
  }
};
