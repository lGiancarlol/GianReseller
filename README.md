# GianReseller

Panel SaaS de administración y automatización de licencias digitales.

GianReseller **no genera licencias**. Se conecta a sistemas externos (Telegram Bots, KeyAuth, REST APIs, paneles de terceros) y administra el flujo completo: proveedores, resellers, solicitudes, créditos y logs.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 · TypeScript · TailwindCSS |
| Backend | Next.js API Routes |
| Base de datos | PostgreSQL 17 · Prisma ORM |
| Autenticación | NextAuth v5 · JWT · Credentials |
| Cifrado | AES-256-GCM (campos sensibles) |

---

## Arquitectura del sistema

```
GianReseller (panel)
│
├── Administra providers externos
│   ├── Telegram Bot
│   ├── KeyAuth
│   ├── REST API
│   └── Custom
│
├── Administra resellers
│   └── créditos · licencias · ventas
│
├── Procesa license requests
│   └── reseller → provider → licencia → respuesta → log
│
└── Registra logs técnicos
    └── request · response · latencia · errores
```

> El panel **nunca genera licencias**. Solo envía solicitudes a proveedores externos y almacena las respuestas.

---

## Requisitos

- Node.js 18+
- PostgreSQL 17+
- npm

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/lGiancarlol/GianReseller.git
cd GianReseller

# 2. Instalar dependencias
npm install
```

---

## Configuración

Crea el archivo `.env` en la raíz del proyecto:

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/gianreseller"

# NextAuth - generar con: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
AUTH_SECRET="TU_SECRET_AQUI"

# URL base
NEXTAUTH_URL="http://localhost:3000"

# Clave AES-256 para cifrar campos sensibles - generar con:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="64_CARACTERES_HEX_AQUI"
```

---

## Base de datos

```bash
# Crear la base de datos en PostgreSQL
psql -U postgres -c "CREATE DATABASE gianreseller;"

# Aplicar el esquema
npx prisma db push

# Crear usuario administrador inicial
npm run db:seed
```

Credenciales del admin creado por el seed:

```
Email:      admin@gianreseller.com
Contraseña: admin123
```

> Cambiar la contraseña del admin desde Settings después del primer login.

---

## Desarrollo

```bash
npm run dev
```

Accede en: `http://localhost:3000`

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run db:push` | Sincronizar esquema con la base de datos |
| `npm run db:studio` | Abrir Prisma Studio (admin visual de la BD) |
| `npm run db:seed` | Crear usuario admin inicial |

---

## Estructura del proyecto

```
GianReseller/
│
├── app/
│   ├── (auth)/
│   │   └── login/                  # Página de login
│   ├── (dashboard)/
│   │   ├── dashboard/              # Dashboard con estadísticas
│   │   └── providers/
│   │       ├── page.tsx            # Listado de providers
│   │       └── [id]/page.tsx       # Detalle del provider
│   └── api/
│       ├── auth/[...nextauth]/     # Handler de NextAuth
│       └── providers/
│           ├── route.ts            # GET listar · POST crear
│           └── [id]/
│               ├── route.ts        # GET · PUT · DELETE
│               ├── test/           # POST prueba de conexión real
│               └── products/       # CRUD de productos del provider
│
├── components/
│   ├── providers/
│   │   ├── ProvidersClient.tsx     # Tabla con filtros y acciones
│   │   ├── ProviderForm.tsx        # Modal crear/editar
│   │   └── ProviderDetailClient.tsx # Página de detalle completa
│   └── ui/
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Field.tsx
│       ├── Modal.tsx
│       └── StatCard.tsx
│
├── lib/
│   ├── auth.ts                     # Configuración NextAuth
│   ├── prisma.ts                   # Singleton PrismaClient
│   ├── crypto.ts                   # Cifrado AES-256-GCM
│   └── providers/
│       ├── BaseProvider.ts         # Interface IProvider
│       ├── TelegramProvider.ts     # Driver Telegram real
│       ├── KeyAuthProvider.ts      # Driver KeyAuth
│       ├── RestApiProvider.ts      # Driver REST API genérico
│       └── ProviderFactory.ts      # Factory por tipo
│
├── prisma/
│   ├── schema.prisma               # Modelos de la base de datos
│   └── seed.ts                     # Datos iniciales
│
└── types/
    └── provider.ts                 # Tipos TypeScript compartidos
```

---

## Módulos del sistema

### Dashboard
Estadísticas en tiempo real: providers, resellers, license requests, licencias exitosas y logs.

### Providers
Administración completa de proveedores externos.

- CRUD completo con validación
- Tipos soportados: Telegram Bot · KeyAuth · REST API · Custom
- Configuración dinámica por tipo (campos distintos según el provider)
- Cifrado AES-256-GCM para campos sensibles: `botToken`, `apiKey`, `sessionString`, `password`, `bearerToken`
- Prueba de conexión real por tipo
- Página de detalle con logs técnicos, latencia y respuesta raw
- Sistema de productos por provider (`ProviderProduct`)

### Resellers *(Fase 3 - próximamente)*
Gestión de revendedores con créditos, historial de ventas y control de acceso.

### License Requests *(Fase 4 - próximamente)*
Flujo completo: reseller selecciona provider + producto + duración → el panel envía la solicitud → el provider externo genera la licencia → el panel almacena la respuesta.

### Logs *(Fase 5 - próximamente)*
Registro técnico completo con filtros por acción, provider y fecha.

---

## Driver System

Todos los providers implementan la interface `IProvider`:

```typescript
interface IProvider {
  testConnection(): Promise<TestResult>
  requestLicense(product, duration, resellerRef?): Promise<LicenseResult>
  queryLicense(licenseKey): Promise<LicenseQuery>
  activateLicense(licenseKey, hwid?): Promise<LicenseResult>
  deactivateLicense(licenseKey): Promise<LicenseResult>
  resetIp(licenseKey): Promise<LicenseResult>
}
```

| Driver | testConnection | Licencias |
|---|---|---|
| TelegramProvider | `getMe` + `getChat` real | Fase 4 |
| KeyAuthProvider | HEAD al servidor | Fase 4 |
| RestApiProvider | GET con headers custom | Fase 4 |

---

## Cifrado de datos sensibles

Los campos sensibles se cifran con AES-256-GCM antes de almacenarse en PostgreSQL.

Campos cifrados: `botToken` · `apiKey` · `sessionString` · `password` · `bearerToken`

Formato almacenado: `enc:IV_HEX:AUTH_TAG_HEX:CIPHERTEXT_HEX`

En los formularios, los campos ya guardados muestran `********`. Si el usuario no modifica el campo, el valor cifrado original se conserva sin recifrar.

---

## Modelos de base de datos

```
User             → administradores del panel
Provider         → proveedores externos (config cifrado)
ProviderProduct  → productos disponibles por provider
Reseller         → revendedores con créditos
LicenseRequest   → solicitudes de licencia
Log              → registro técnico de todas las operaciones
```

---

## Fases de desarrollo

| Fase | Estado | Descripción |
|---|---|---|
| 1 | Completada | Estructura base · Prisma · Login · Dashboard |
| 2 | Completada | Módulo Providers CRUD completo |
| 2.1 | Completada | Cifrado AES-256-GCM para config sensible |
| 2.5 | Completada | Driver system real · Detalle de provider · Productos |
| 3 | Pendiente | Módulo Resellers |
| 4 | Pendiente | License Requests |
| 5 | Pendiente | Logs con filtros avanzados |

---

## Variables de entorno requeridas

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL |
| `AUTH_SECRET` | Secret para firmar JWT (32+ bytes en base64) |
| `NEXTAUTH_URL` | URL base de la aplicación |
| `ENCRYPTION_KEY` | Clave AES-256 en hex (64 caracteres) |

---

## Seguridad

- Contraseñas hasheadas con bcrypt (12 rounds)
- Campos sensibles cifrados con AES-256-GCM con IV único por campo
- Sesiones JWT firmadas con AUTH_SECRET
- Todas las API routes verifican sesión activa antes de procesar
- `.env` excluido del repositorio vía `.gitignore`

---

## Licencia

Proyecto privado. Todos los derechos reservados.
