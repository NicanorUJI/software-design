# Spike – Diseño del software

Este repositorio contiene el *spike* inicial del proyecto de movilidad solicitado en el documento oficial del **Proyecto Conjunto de Diseño y Paradigmas de Software (UJI, curso 2025/2026)**.

---

## 🧩 Objetivos del Spike

Durante este spike se probaron con éxito los siguientes puntos:

| Área | Tecnología | Estado |
|------|-------------|--------|
| 🗺️ Mapas | [Leaflet](https://leafletjs.com/) | ✅ Integrado, mostrando mapa interactivo |
| 🗍️ Cálculo de rutas | [OpenRouteService API](https://openrouteservice.org/) | ✅ Peticiones REST funcionales |
| ☁️ Persistencia | [Firebase Firestore](https://firebase.google.com/docs/firestore) | ✅ CRUD funcional para entidades |
| 🔧 Arquitectura | React + TypeScript + modular services | ✅ Código desacoplado y mantenible |
| ⚙️ Configuración | Variables de entorno + reglas dev | ✅ Implementado |

---

## 📁 Estructura del proyecto

```
fake-maps/
├── src/
│   ├── components/           # UI principal (mapa, búsqueda, etc.)
│   ├── services/
│   │   ├── firebase.ts       # Configuración Firebase
│   │   ├── firestoreHelpers.ts
│   │   └── repos/            # CRUDs por entidad
│   │       ├── placesRepo.ts
│   │       ├── vehiclesRepo.ts
│   │       ├── routesRepo.ts
│   │       └── preferencesRepo.ts
│   └── types/domain.ts       # Tipos de datos del dominio
│
├── tests/
│   ├── __mocks__/firestoreHelpers.mock.ts  # Mock in-memory de Firestore
│   ├── placesRepo.test.ts
│   ├── vehiclesRepo.test.ts
│   ├── routesRepo.test.ts
│   └── preferencesRepo.test.ts
│
├── firestore.rules           # Reglas dev (todo permitido)
├── vitest.config.ts          # Configuración de Vitest
├── .env.local.example        # Variables de entorno de ejemplo
└── README.md
```

---

## ⚙️ Instalación y configuración

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/<tu_usuario>/fake-maps.git
cd fake-maps
```

### 2️⃣ Instalar dependencias

```bash
npm install
```

### 3️⃣ Configurar variables de entorno

Crea un archivo `.env.local` en la raíz con tus credenciales de Firebase:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...firebaseapp.com
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=1:...:web:...
VITE_ORS_API_KEY=...
```
---

## 🧬 Entidades persistidas

Cada entidad tiene su propio CRUD implementado en `src/services/repos`:

| Entidad | Campos principales | Descripción |
|----------|--------------------|--------------|
| **Places** | label, position(lat/lng) | Lugares de interés |
| **Vehicles** | name, fuelType, consumption | Vehículos del usuario |
| **Routes** | origin, destination, profile, distanceKm, durationMin | Rutas guardadas |
| **Preferences** | defaultProfile, defaultFuelType | Preferencias de usuario |


## 🧪 Ejecución de pruebas

El proyecto incluye **tests unitarios** con mocks en memoria, por lo que no se requiere conexión real a Firebase.

### Ejecutar una sola vez:
```bash
npx vitest
```

### Ejecutar en modo observador:
```bash
npx vitest --watch
```

### Ejecutar con cobertura:
```bash
npx vitest run --coverage
```

> Los tests cubren los repositorios de `places`, `vehicles`, `routes` y `preferences`.

---

## 💡 Lo que demuestra este Spike

✅ Llamadas REST correctas a OpenRouteService.  
✅ Renderizado de mapa interactivo con Leaflet.  
✅ Lectura/escritura en Firestore (modo dev).  
✅ Código modular, desacoplado y escalable.  
✅ Pruebas unitarias ejecutables localmente con mocks.  

---
