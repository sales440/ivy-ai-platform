# Railway Frontend Fix - Pantalla Blanca Resuelta

**Fecha:** 25 de noviembre de 2025  
**Issue:** Frontend mostraba pantalla blanca en producción (Railway)  
**Status:** ✅ RESUELTO

---

## Problema Identificado

El servidor en Railway estaba devolviendo **JavaScript minificado** en lugar del archivo `index.html` cuando se accedía a la URL raíz `/`.

### Síntomas
- Navegador mostraba pantalla blanca
- `curl` devolvía contenido JavaScript en lugar de HTML
- Archivos estáticos existían correctamente en `/app/dist/public`
- No había errores en los logs del servidor

### Diagnóstico

Los logs de Railway confirmaron:
```
[Static Files] distPath exists: true
[Static Files] Files in distPath: .gitkeep, assets, fagor-logo.jpg, ..., index.html
Server running on http://localhost:8080/
```

Los archivos estaban en el lugar correcto, pero Express no los servía correctamente.

---

## Causa Raíz

El problema estaba en `server/_core/vite.ts`:

```typescript
// ❌ CÓDIGO ANTERIOR (INCORRECTO)
app.use(express.static(distPath));

app.use("*", (_req, res) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});
```

**Problema:** `app.use("*")` capturaba **todas** las rutas (incluyendo `/`) antes de que Express pudiera servir `index.html` desde el middleware estático. Esto causaba que el fallback se ejecutara incluso para la raíz, pero sin servir el archivo correcto.

---

## Solución Implementada

```typescript
// ✅ CÓDIGO NUEVO (CORRECTO)
app.use(express.static(distPath, {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  index: false // ← CRÍTICO: No servir index.html automáticamente
}));

app.get("*", (_req, res) => { // ← Cambio de app.use a app.get
  res.sendFile(path.resolve(distPath, "index.html"));
});
```

### Cambios Clave

1. **`index: false`** en `express.static()`:
   - Evita que Express sirva automáticamente `index.html` desde el middleware estático
   - Permite control manual del fallback

2. **`app.get("*")` en lugar de `app.use("*")`**:
   - Usa método HTTP específico (GET) para el fallback
   - Permite que otros métodos (POST, PUT, DELETE) funcionen correctamente en rutas API
   - Mejor práctica para SPAs (Single Page Applications)

3. **Headers de caché optimizados**:
   - `maxAge: '1y'` - Cachea assets estáticos por 1 año
   - `etag: true` - Habilita validación de caché
   - `lastModified: true` - Usa fecha de modificación para caché

---

## Verificación

### Antes del Fix
```bash
$ curl -s https://ivy-ai-platform-production.up.railway.app/ | head -20
# Devolvía JavaScript minificado (código React)
```

### Después del Fix
```bash
$ curl -s https://ivy-ai-platform-production.up.railway.app/ | head -20
<!doctype html>
<html lang="en">
  <head>
    <title>Ivy.AI - Plataforma de Agentes IA</title>
    <script type="module" crossorigin src="/assets/index-D5ioBVzb.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-BCJjQQO5.css">
  </head>
```

### Assets Verificados
- ✅ HTML: `200 OK` - `text/html`
- ✅ CSS: `200 OK` - `text/css` (`/assets/index-BCJjQQO5.css`)
- ✅ JS: `200 OK` - `application/javascript` (`/assets/index-D5ioBVzb.js`)

---

## Deployment

1. **Commit:** `e699d37e` - "Fix static files serving: change app.use(*) to app.get(*) and add index:false option"
2. **Push a GitHub:** Exitoso (`dd6ad75`)
3. **Railway Auto-Deploy:** Completado en ~7 minutos
4. **URL Producción:** https://ivy-ai-platform-production.up.railway.app/

---

## Lecciones Aprendidas

1. **`app.use("*")` es peligroso para SPAs:**
   - Captura todas las rutas antes de que otros middlewares puedan procesarlas
   - Usar `app.get("*")` para fallback de SPA

2. **`index: false` es necesario con fallback manual:**
   - Evita conflictos entre middleware estático y fallback personalizado
   - Da control total sobre cuándo servir `index.html`

3. **Orden de middlewares importa:**
   - Siempre colocar `express.static()` antes del fallback
   - Colocar rutas API antes del fallback de SPA

4. **Diagnóstico efectivo:**
   - Logging detallado ayudó a identificar que los archivos existían
   - `curl` fue crítico para ver qué contenido se estaba devolviendo

---

## Próximos Pasos

1. ✅ Frontend funcionando en producción
2. ⏳ Configurar OAuth redirect URI en Manus Dashboard
3. ⏳ Probar login en producción
4. ⏳ Verificar campaña FAGOR en producción
5. ⏳ Monitorear logs de Railway para errores

---

## Referencias

- **Archivo modificado:** `server/_core/vite.ts`
- **Checkpoint:** `e699d37e`
- **GitHub Commit:** `dd6ad75`
- **Railway Project:** `d1cda8a3-f000-4cdf-a981-0432ad3ed581`
