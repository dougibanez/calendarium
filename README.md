# Calendarium — Calendario Familiar

App web para organizar la agenda de un grupo familiar. Cada miembro inicia sesión con su nombre y ve todos los eventos en un calendario compartido. Cada persona tiene un color único asignado automáticamente.

**Demo:** https://calendarium-one.vercel.app/

---

## Stack

- **Next.js 14** (App Router)
- **NextAuth v4** — autenticación por nombre (sin contraseña)
- **Prisma ORM** — modelo de datos con PostgreSQL
- **Neon** — base de datos PostgreSQL serverless (free tier)
- **Vercel** — hosting y deploy continuo
- **Tailwind CSS** — estilos

---

## Funcionalidades

- Login por nombre: cualquier miembro entra escribiendo su nombre (o usando los accesos rápidos Mamá, Papá, Sofía, Lucas)
- Calendario mensual compartido, semanas de lunes a domingo en español
- Crear eventos con título, descripción, fecha/hora y duración
- Eventos de todo el día
- Color único por persona, asignado automáticamente según el ID de usuario
- Solo el creador de un evento puede eliminarlo
- Leyenda de participantes con eventos en el mes visible
- Responsive: modal tipo sheet en mobile, diálogo centrado en desktop

---

## Setup de base de datos (Neon)

Se usó Neon como proveedor de PostgreSQL serverless con free tier.

### Pasos realizados

1. Crear cuenta en [neon.tech](https://neon.tech)
2. Crear nuevo proyecto → se genera automáticamente una base de datos llamada `neondb`
3. Desde el dashboard del proyecto, ir a **Connection Details**
4. Copiar la **Connection string** en formato:
   ```
   postgresql://usuario:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
5. Guardar ese valor como `DATABASE_URL` — se usa tanto en Vercel como en desarrollo local

El schema se aplica automáticamente en cada deploy mediante `prisma db push` (incluido en el build command).

---

## Deploy en Vercel

Se usó Vercel conectado al repositorio GitHub con deploy automático desde la rama `claude/family-calendar-app-CVSoI`.

### Pasos realizados

1. Ir a [vercel.com/new](https://vercel.com/new)
2. Importar el repositorio `dougibanez/calendarium` desde GitHub
3. Seleccionar la rama `claude/family-calendar-app-CVSoI`
4. En **Environment Variables**, agregar las siguientes tres variables antes de deployar:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string de Neon (postgresql://...) |
| `NEXTAUTH_SECRET` | Clave secreta para cifrar sesiones (generada con `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL pública del proyecto en Vercel |

5. Click en **Deploy**
6. Vercel ejecuta el build command `prisma generate && prisma db push && next build`, que genera el cliente Prisma, aplica el schema en Neon y compila Next.js
7. La app queda disponible en la URL asignada por Vercel

### Variables de entorno configuradas en Vercel

```
NEXTAUTH_SECRET=1cUszi6MKUFtHjA7VW70i7LEFqGYl9jKe3RHnqiquyU=
DATABASE_URL=postgresql://...@...neon.tech/neondb?sslmode=require
NEXTAUTH_URL=https://calendarium-one.vercel.app
```

---

## Desarrollo local

### Requisitos

- Node.js 18+
- Una base de datos PostgreSQL (Neon free tier recomendado, o local)

### Instalación

```bash
git clone https://github.com/dougibanez/calendarium
cd calendarium
git checkout claude/family-calendar-app-CVSoI
npm install
```

### Variables de entorno

Copiar el archivo de ejemplo y completar los valores:

```bash
cp .env.example .env.local
```

Contenido de `.env.local`:

```env
DATABASE_URL="postgresql://usuario:password@host/dbname?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generá-uno-con-openssl-rand-base64-32"
```

### Iniciar

```bash
npm run db:push   # aplica el schema en la base de datos (solo la primera vez)
npm run dev       # inicia el servidor en http://localhost:3000
```

---

## Estructura del proyecto

```
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # handler de NextAuth
│   │   └── events/               # GET y POST de eventos
│   │       └── [id]/             # DELETE de un evento
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx             # SessionProvider de NextAuth
├── components/
│   ├── Calendar.tsx              # calendario mensual interactivo
│   ├── EventModal.tsx            # modal crear/ver evento
│   ├── Header.tsx                # barra superior con usuario
│   └── SignIn.tsx                # pantalla de login
├── lib/
│   ├── auth.ts                   # configuración de NextAuth
│   ├── prisma.ts                 # cliente Prisma singleton
│   └── userColors.ts             # asignación de color por usuario
├── prisma/
│   └── schema.prisma             # modelos User, Event, Account, Session
└── types/
    └── next-auth.d.ts            # extensión de tipos de sesión
```
