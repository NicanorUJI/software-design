# FakeMaps

FakeMaps es una aplicación web (React + TypeScript) para **planificar rutas** y **estimar coste/energía** de viaje. La app está diseñada con una separación clara por capas y aplica patrones (MVVM, Strategy, Adapter y Facade) para mantener el código extensible y razonable de mantener.

## Funcionalidades

- **Autenticación (Firebase Auth)**
  - Registro, login, logout y borrado de cuenta.
- **Planificación de rutas (OpenRouteService / ORS)**
  - Autocomplete de origen/destino.
  - Cálculo de ruta y renderizado en mapa (Leaflet).
- **Estimación de coste / energía**
  - En coche: estimación del coste en € basada en distancia y consumo.
  - A pie / bicicleta: estimación de energía en kcal.
- **Preferencias por usuario (Firestore)**
  - Perfil por defecto (coche / bici / a pie).
  - Tipo de combustible por defecto.
- **Vehículos por usuario (Firestore)**
  - Guardado de vehículos con tipo de combustible y consumo (L/100km).
- **Lugares y rutas guardadas (Firestore)**
  - Guardar lugares y rutas frecuentes.
  - Aplicar lugares guardados al planificador.

## Tech stack

- **Frontend:** React + TypeScript
- **Build tool:** Vite (estructura típica `index.html` + `src/main.tsx`)
- **UI:** Tailwind CSS
- **Mapa:** Leaflet + React-Leaflet
- **Auth/DB:** Firebase Auth + Firestore
- **Routing:** OpenRouteService (Geocoding + Directions)
- **Fuel pricing:** API pública del Gobierno de España (promedio nacional con TTL 30 min)

## Requisitos

- Node.js 18+ (recomendado) y npm
- Cuenta/proyecto Firebase con:
  - Authentication (Email/Password)
  - Firestore habilitado
- API key de OpenRouteService

## Instalación y ejecución

1) Instalar dependencias

```bash
npm install
```

2) Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto (ver plantilla abajo).

3) Ejecutar en modo desarrollo

```bash
npm run dev
```

4) Build de producción

```bash
npm run build
npm run preview
```

## Variables de entorno

La app usa variables `VITE_*` (Vite expone estas variables al frontend).

Crea un `.env.local` con:

```bash
# OpenRouteService
VITE_ORS_API_KEY=...

# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

Recomendación: mantener un `.env.example` en el repo (sin secretos) y **no** commitear `.env.local`.

## Arquitectura

### Estructura de carpetas (resumen)

```text
src/
  domain/
    cost/               # Strategy: cálculo de coste/energía
    facades/            # Facade: orquestación del flujo "planTrip"
    ports/              # Puertos (interfaces) para servicios externos
  services/
    adapters/           # Adapters: implementaciones de puertos (ORS, fuel)
    repos/              # Persistencia Firestore (por usuario)
    auth.ts             # operaciones auth
    firebase.ts         # init Firebase
  viewModels/           # MVVM: estado + acciones
    base/               # ViewModel base + hook
  components/           # UI components
  layouts/ pages/ routes/
  utils/ types/
```

### Patrones aplicados

- **MVVM**
  - `viewModels/*` concentra estado, side-effects y acciones.
  - Los componentes consumen estado y disparan acciones, evitando lógica de negocio en la UI.

- **Strategy (costos)**
  - `domain/cost/*Strategy.ts` implementa estrategias por modo (`driving-car`, `cycling-regular`, `foot-walking`).
  - `domain/cost/TripCostCalculator` selecciona estrategia según `TravelProfile`.

- **Adapter (integraciones externas)**
  - `domain/ports/*` define interfaces (`RoutingService`, `FuelPricingService`).
  - `services/adapters/*` implementa esas interfaces para desacoplar dominio de proveedores externos.

- **Facade (flujo de negocio de alto nivel)**
  - `domain/facades/TripPlannerFacade` centraliza: routing + fuel price + cálculo de coste.

## Persistencia (Firestore)

La persistencia está organizada por usuario:

- `users/{uid}/places`
- `users/{uid}/routes`
- `users/{uid}/vehicles`
- `users/{uid}/preferences`
