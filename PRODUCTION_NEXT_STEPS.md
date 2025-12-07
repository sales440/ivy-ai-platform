# Próximos Pasos - Producción Railway

**Status Actual:** ✅ Frontend funcionando correctamente en Railway  
**URL Producción:** https://ivy-ai-platform-production.up.railway.app/

---

## 1. Configurar OAuth para Login en Producción

**Status:** ⏳ PENDIENTE

### Pasos:

1. **Acceder a Manus Dashboard:**
   - URL: https://manus.im (o la URL de tu instancia Manus)
   - Login con tu cuenta

2. **Agregar Redirect URI:**
   - Navegar a: Settings → OAuth → Redirect URIs
   - Agregar: `https://ivy-ai-platform-production.up.railway.app/api/oauth/callback`
   - Guardar cambios

3. **Verificar Variables de Entorno en Railway:**
   ```
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://portal.manus.im
   VITE_APP_ID=<tu_app_id>
   ```

4. **Probar Login:**
   - Abrir: https://ivy-ai-platform-production.up.railway.app/
   - Click en botón "Login" o "Sign In"
   - Debería redirigir a Manus OAuth
   - Después de autenticar, redirigir de vuelta a Ivy.AI

### Troubleshooting:

Si el login falla con error "redirect_uri not allowed":
- Verificar que el redirect URI esté exactamente como se agregó en Manus
- Verificar que no haya espacios o caracteres extra
- Verificar que el protocolo sea `https://` (no `http://`)

---

## 2. Probar Campaña FAGOR en Producción

**Status:** ⏳ PENDIENTE

### Verificaciones:

1. **Acceder a FAGOR Campaign:**
   - URL: https://ivy-ai-platform-production.up.railway.app/fagor-campaign
   - Login requerido (completar paso 1 primero)

2. **Verificar Datos Existentes:**
   - Deberías ver 20 contactos importados
   - Verificar que estén enrollados en la campaña

3. **Verificar Drip Scheduler:**
   - Revisar logs de Railway para confirmar que el scheduler está corriendo:
     ```
     [FAGOR Drip] Running scheduled check...
     [FAGOR Drip] Found X contacts eligible for Email 2
     ```

4. **Verificar SendGrid:**
   - Acceder a SendGrid Dashboard
   - Verificar que los emails se estén enviando
   - Revisar métricas de opens/clicks

### Datos Actuales:

- **20 contactos** importados el 24 de noviembre
- **Email 1** enviado a todos (Day 0)
- **Email 2** programado para Day 3 (27 de noviembre)
- **Email 3** programado para Day 7 (1 de diciembre)

---

## 3. Monitorear Performance en Producción

**Status:** ⏳ PENDIENTE

### Métricas a Revisar:

1. **Server Health:**
   - Railway Dashboard → Metrics
   - CPU usage (debería estar < 50%)
   - Memory usage (debería estar < 512 MB)
   - Response times (debería estar < 500ms)

2. **Database Performance:**
   - Railway → Database → Metrics
   - Connections activas
   - Query performance
   - Storage usage

3. **Application Logs:**
   - Railway → Deployments → Logs
   - Buscar errores o warnings
   - Verificar que scheduled tasks estén corriendo

### Alertas Recomendadas:

- CPU > 80% por más de 5 minutos
- Memory > 80% por más de 5 minutos
- Response time > 1 segundo
- Error rate > 5%

---

## 4. Configurar Domain Personalizado (Opcional)

**Status:** 📋 OPCIONAL

Si quieres usar un dominio personalizado (ej: `ivy-ai.com`):

1. **En Railway:**
   - Settings → Domains
   - Add Custom Domain
   - Ingresar: `ivy-ai.com` o `app.ivy-ai.com`

2. **En tu DNS Provider:**
   - Agregar registro CNAME:
     ```
     Type: CNAME
     Name: app (o @ para root domain)
     Value: <railway-provided-domain>
     ```

3. **Actualizar OAuth Redirect URI:**
   - Agregar nuevo redirect URI en Manus Dashboard:
     `https://app.ivy-ai.com/api/oauth/callback`

---

## 5. Backup y Disaster Recovery

**Status:** 📋 RECOMENDADO

### Backups Automáticos:

Railway hace backups automáticos de la base de datos, pero es recomendable:

1. **Configurar Backups Manuales:**
   ```bash
   # Exportar base de datos
   mysqldump -h <railway-host> -u <user> -p <database> > backup.sql
   ```

2. **Programar Backups Semanales:**
   - Usar Railway Cron Jobs
   - O configurar GitHub Actions para backups automáticos

3. **Documentar Proceso de Restore:**
   - Crear script de restore
   - Probar restore en ambiente de staging

---

## 6. Optimizaciones Futuras

**Status:** 💡 IDEAS

### Performance:

1. **CDN para Assets Estáticos:**
   - Configurar Cloudflare o similar
   - Cachear CSS, JS, imágenes

2. **Database Indexing:**
   - Revisar queries lentas
   - Agregar indexes donde sea necesario

3. **Caching:**
   - Redis para session storage
   - Cache de queries frecuentes

### Features:

1. **Analytics:**
   - Integrar Google Analytics o Plausible
   - Dashboard de métricas de negocio

2. **Monitoring:**
   - Sentry para error tracking
   - Uptime monitoring (UptimeRobot, Pingdom)

3. **CI/CD:**
   - Tests automáticos en GitHub Actions
   - Deploy automático solo si tests pasan

---

## Checklist de Producción

- [x] Frontend desplegado y funcionando
- [x] Backend desplegado y funcionando
- [x] Base de datos migrada correctamente
- [x] FAGOR tables creadas
- [x] Drip scheduler corriendo
- [ ] OAuth configurado para producción
- [ ] Login funcionando en producción
- [ ] FAGOR campaign probada en producción
- [ ] Monitoring configurado
- [ ] Backups configurados
- [ ] Documentación completa

---

## Contacto y Soporte

**Email:** jcrobledolopez@gmail.com  
**GitHub:** https://github.com/sales440/ivy-ai-platform  
**Railway Project:** d1cda8a3-f000-4cdf-a981-0432ad3ed581

---

## Referencias

- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT_GUIDE.md)
- [Frontend Fix Documentation](./RAILWAY_FRONTEND_FIX.md)
- [FAGOR Campaign Setup](./EPM_IMPLEMENTACION_FINAL.md)
- [OAuth Setup Guide](./RAILWAY_OAUTH_SETUP.md)
