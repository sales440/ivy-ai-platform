# Guía de Creación de Usuarios - Ivy.AI Platform

**Para:** EPM Construcciones SA de CV  
**Fecha:** 19 de Noviembre, 2025  
**Versión:** 1.0

---

## USUARIO CREADO PARA EPM CONSTRUCCIONES

### Credenciales del Administrador

**Nombre:** Arq. Leoncio Eloy Robledo L.  
**Email:** epmconstrucciones@gmail.com  
**Rol:** Admin  
**User ID:** 8  
**OpenID:** epm_leoncio_robledo_001  
**Empresa:** EPM Construcciones SA de CV (Company ID: 4)

### Acceso a la Plataforma

**URL:** https://ivy-ai-hoxbpybq.manus.space  
**Login:** Usar autenticación OAuth de Manus  
**Primer acceso:** Configurar perfil y preferencias

---

## CÓMO CREAR NUEVOS USUARIOS (PASO A PASO)

### Método 1: Desde la Interfaz Web (RECOMENDADO)

#### Paso 1: Acceder a Gestión de Usuarios
1. Login en https://ivy-ai-hoxbpybq.manus.space
2. Ir a **Dashboard** → **Gestión de Empresas** (sidebar izquierdo)
3. Seleccionar **EPM Construcciones SA de CV**
4. Click en pestaña **"Asignaciones Usuario-Empresa"**

#### Paso 2: Invitar Nuevo Usuario
1. Click en botón **"Assign User"** (esquina superior derecha)
2. Completar formulario:
   - **Email:** email del nuevo usuario
   - **Nombre:** nombre completo
   - **Rol:** seleccionar entre:
     - `admin` - Acceso total a configuración y agentes
     - `user` - Acceso limitado a funciones operativas
3. Click en **"Send Invitation"**

#### Paso 3: Usuario Acepta Invitación
1. Usuario recibe email de invitación
2. Click en link de activación
3. Completa registro con OAuth de Manus
4. Automáticamente asignado a EPM Construcciones

---

### Método 2: Desde Base de Datos (AVANZADO)

⚠️ **Solo para administradores técnicos**

#### Paso 1: Crear Usuario en Tabla `users`

```sql
INSERT INTO users (openId, name, email, role, createdAt, updatedAt, lastSignedIn) 
VALUES (
  'epm_usuario_unique_id',  -- ID único para el usuario
  'Nombre Completo',         -- Nombre del usuario
  'email@ejemplo.com',       -- Email corporativo
  'user',                    -- Rol: 'admin' o 'user'
  NOW(),
  NOW(),
  NOW()
);
```

**Ejemplo Real:**
```sql
INSERT INTO users (openId, name, email, role, createdAt, updatedAt, lastSignedIn) 
VALUES (
  'epm_gerente_ventas_001',
  'Ing. María González',
  'maria.gonzalez@epmconstrucciones.com',
  'user',
  NOW(),
  NOW(),
  NOW()
);
```

#### Paso 2: Obtener User ID

```sql
SELECT id, name, email, role 
FROM users 
WHERE openId = 'epm_gerente_ventas_001';
```

Resultado esperado:
```
| id | name                 | email                                  | role |
|----|----------------------|----------------------------------------|------|
| 9  | Ing. María González  | maria.gonzalez@epmconstrucciones.com   | user |
```

#### Paso 3: Asignar Usuario a Empresa (Si existe tabla `companyUsers`)

```sql
INSERT INTO companyUsers (companyId, userId, role, createdAt, updatedAt)
VALUES (
  4,                    -- Company ID de EPM Construcciones
  9,                    -- User ID obtenido en Paso 2
  'member',             -- Rol en la empresa
  NOW(),
  NOW()
);
```

---

## ROLES Y PERMISOS

### Rol: `admin`
**Permisos:**
- ✅ Configurar agentes IA
- ✅ Ver y modificar todos los leads
- ✅ Gestionar usuarios de la empresa
- ✅ Acceso a analytics y reportes completos
- ✅ Configurar integraciones (email, WhatsApp, calendario)
- ✅ Modificar configuración de empresa

**Usuarios recomendados:**
- Director General
- Gerente Comercial
- Coordinador de Operaciones

---

### Rol: `user`
**Permisos:**
- ✅ Ver leads asignados
- ✅ Actualizar estado de leads
- ✅ Crear y gestionar tickets
- ✅ Ver calendario de servicios
- ✅ Acceso a reportes básicos
- ❌ No puede configurar agentes
- ❌ No puede gestionar usuarios

**Usuarios recomendados:**
- Ejecutivos de ventas
- Técnicos de mantenimiento
- Coordinadores de servicio

---

## MEJORES PRÁCTICAS

### 1. Nomenclatura de OpenID
Usar formato consistente:
```
epm_[rol]_[nombre]_[número]
```

Ejemplos:
- `epm_director_001` - Director General
- `epm_gerente_ventas_001` - Gerente de Ventas
- `epm_tecnico_electrico_001` - Técnico Eléctrico
- `epm_ejecutivo_ventas_001` - Ejecutivo de Ventas

### 2. Emails Corporativos
- Usar siempre emails corporativos (@epmconstrucciones.com)
- Evitar emails personales (Gmail, Hotmail, etc.)
- Validar que el email esté activo antes de crear usuario

### 3. Asignación de Roles
- **Máximo 2-3 admins** por empresa
- Resto de usuarios con rol `user`
- Revisar permisos trimestralmente

### 4. Seguridad
- Cambiar contraseñas cada 90 días
- Activar autenticación de dos factores (2FA)
- Revocar acceso inmediatamente cuando un empleado deja la empresa

---

## USUARIOS RECOMENDADOS PARA EPM CONSTRUCCIONES

### Equipo Inicial (6 usuarios)

| # | Nombre | Email | Rol | Departamento |
|---|--------|-------|-----|--------------|
| 1 | Arq. Leoncio Eloy Robledo L. | epmconstrucciones@gmail.com | admin | Dirección General |
| 2 | Gerente Comercial | ventas@epmconstrucciones.com | admin | Ventas |
| 3 | Coordinador de Operaciones | operaciones@epmconstrucciones.com | admin | Operaciones |
| 4 | Ejecutivo de Ventas 1 | ejecutivo1@epmconstrucciones.com | user | Ventas |
| 5 | Ejecutivo de Ventas 2 | ejecutivo2@epmconstrucciones.com | user | Ventas |
| 6 | Técnico Líder | tecnico@epmconstrucciones.com | user | Operaciones |

---

## PROCESO DE ONBOARDING

### Semana 1: Administradores
1. **Día 1:** Crear usuarios admin (3 personas)
2. **Día 2:** Capacitación en configuración de agentes (2 horas)
3. **Día 3:** Configurar agentes IVY-PROSPECT e IVY-QUALIFY
4. **Día 4:** Revisar primeros leads generados
5. **Día 5:** Ajustar configuración según resultados

### Semana 2: Equipo Operativo
1. **Día 1:** Crear usuarios operativos (3 personas)
2. **Día 2:** Capacitación en uso de plataforma (2 horas)
3. **Día 3:** Asignar leads de prueba
4. **Día 4:** Practicar seguimiento y tickets
5. **Día 5:** Evaluación y retroalimentación

---

## TROUBLESHOOTING

### Problema: Usuario no puede hacer login
**Solución:**
1. Verificar que el email esté correcto en BD
2. Verificar que `openId` sea único
3. Limpiar caché del navegador
4. Intentar con navegador en modo incógnito

### Problema: Usuario no ve empresa EPM
**Solución:**
1. Verificar asignación en tabla `companyUsers`
2. Verificar que `companyId` sea 4
3. Hacer logout y login nuevamente

### Problema: Usuario no tiene permisos suficientes
**Solución:**
1. Verificar rol en tabla `users`
2. Cambiar rol de `user` a `admin` si es necesario:
```sql
UPDATE users 
SET role = 'admin' 
WHERE id = [USER_ID];
```

---

## CONTACTO Y SOPORTE

**Soporte Técnico Ivy.AI:**  
📧 support@ivy-ai.com  
📞 +52 1 951 XXX XXXX  
🕐 Lunes a Viernes 8:00 AM - 8:00 PM

**Documentación:**  
🌐 https://docs.ivy-ai.com/users  
📚 https://docs.ivy-ai.com/permissions

---

**Documento preparado por:** Ivy.AI Technical Team  
**Última actualización:** 19 de Noviembre, 2025  
**Versión:** 1.0
