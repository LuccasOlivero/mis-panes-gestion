# Panteca

Sistema de gestión interna para panadería: control de caja por turnos, ventas
y gastos, producción diaria, empleados (fichaje, adelantos, sanciones,
liquidaciones), reparto/pedidos y clientes — con login por usuario/contraseña
y dos niveles de acceso.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + React 19 + TypeScript
- [Supabase](https://supabase.com) (Postgres + Auth) como backend
- Tailwind CSS v4
- TanStack Query / TanStack Table
- Zod para validaciones
- Recharts para el dashboard

## Módulos

- **Turnos** — apertura/cierre manual de caja.
- **Movimientos** — ventas y gastos del turno activo + historial completo.
- **Producción** — registro diario de latas por tipo de pan.
- **Empleados** — alta, fichaje, adelantos, sanciones, liquidaciones y gestión
  de accesos.
- **Reparto / Pedidos** — logística de entrega y pedidos.
- **Clientes** — gestión de clientes.
- **Dashboard** — métricas generales del negocio (solo gerente, ver abajo).

## Roles y acceso

La app tiene login obligatorio (usuario + contraseña) con dos roles:

- **Gerente** — acceso completo, sin restricciones.
- **Empleada de caja** — acceso a todas las secciones excepto el Dashboard
  general y, dentro del perfil de un empleado, las pestañas de Liquidaciones,
  Sanciones, Adelantos y Editar. Si intenta entrar a algo restringido (por URL
  directa, por ejemplo), ve una pantalla dedicada de "sin acceso" con un botón
  para volver al login.

Cada empleado tiene su propia cuenta (no se comparten credenciales por rol).
El gerente crea y administra esas cuentas desde la pestaña **Acceso** del
perfil de cada empleado — no hace falta tocar el dashboard de Supabase para
altas normales, solo para el bootstrap inicial (ver más abajo).

El login usa un **usuario** (no un email real): internamente se sintetiza
como `usuario@mispanes.local` para Supabase Auth, que solo acepta identidades
con forma de email.

## Getting Started

### 1. Variables de entorno

Crear `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 2. Instalar dependencias y correr en desarrollo

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### 3. Bootstrap del primer usuario (gerente)

La app requiere al menos una cuenta de gerente para poder crear las demás
desde la UI. Como es un huevo-y-la-gallina (nadie puede usar la pestaña
Acceso sin estar logueado), el primer usuario se crea a mano una única vez:

1. **SQL Editor de Supabase** — crear la fila de empleado:
   ```sql
   insert into public.employees (id, full_name, role, hire_date, base_salary, active)
   values (gen_random_uuid(), 'Tu nombre', 'maestro', current_date, 0, true)
   returning id;
   ```
2. **Dashboard → Authentication → Users → "Add user"**: email
   `tu_usuario@mispanes.local`, contraseña, marcar "Auto Confirm User".
   Copiar el User UID.
3. **SQL Editor** — setear el metadata de rol (el dashboard solo permite
   *ver* el JSON de metadata, no editarlo, así que se hace por SQL directo
   sobre `auth.users`):
   ```sql
   update auth.users
   set raw_user_meta_data = jsonb_build_object(
     'app_role', 'gerente',
     'employee_id', '<id-del-paso-1>',
     'full_name', 'Tu nombre'
   )
   where id = '<user-uid-del-paso-2>';
   ```
4. **SQL Editor** — vincular la cuenta:
   ```sql
   insert into public.employee_accounts (employee_id, auth_user_id, username, app_role, active)
   values ('<id-del-paso-1>', '<user-uid-del-paso-2>', 'tu_usuario', 'gerente', true);
   ```

A partir de ahí, entrás en `/login` y creás el resto de las cuentas
(gerente o cajera) desde la pestaña Acceso de cada empleado.

## Estructura del proyecto

```
app/                    rutas (App Router)
proxy.ts                enforcement de sesión y roles (equivalente a middleware)
src/actions/            Server Actions por dominio
src/components/         componentes por feature (empleados, movimientos, shifts, auth, ...)
src/lib/auth/           sesión actual y guards de rol
src/lib/supabase/       clientes Supabase (admin, browser, sesión SSR)
src/types/              tipos por dominio
```

## Deploy

Pensado para desplegar en [Vercel](https://vercel.com), configurando las
mismas variables de entorno del paso 1 en el proyecto de Vercel.
