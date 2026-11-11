# StayLedger (calendar_app)

App React Native (Expo) para centralizar reservas de departamentos:

- Calendario por departamento
- Importar `.ics` (Airbnb) o sincronizar por URL iCal
- Banderas de pago (sin pagar / parcial / pagado + monto)
- Contactos de huéspedes vinculados a reservas
- Persistencia gratis en **Google Drive appDataFolder** (sin backend)

## Requisitos

- Node.js 20+
- Expo Go o development build (recomendado para Google Auth en device)

## Instalación

```bash
npm install
npx expo start
```

Luego abrí en Android/iOS con Expo Go, o `npm run android` / `npm run ios`.

## Modo local (sin Google)

En la pantalla de login podés elegir **Usar solo en este dispositivo**. Los datos quedan en SQLite local y no se suben a Drive.

## Configurar Google Drive (gratis)

1. Creá un proyecto en [Google Cloud Console](https://console.cloud.google.com/).
2. Habilitá **Google Drive API**.
3. Configurá la pantalla de consentimiento OAuth (External o Internal).
4. Creá credenciales OAuth:
   - **Web client** (necesario para el flujo de Expo Auth Session)
   - **Android client** (`com.stayledger.calendar` + SHA-1 de tu keystore)
   - **iOS client** (`com.stayledger.calendar`)
5. Agregá el scope `https://www.googleapis.com/auth/drive.appdata`
6. Copiá `.env.example` a `.env` y completá:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

También podés ponerlos en `app.json` → `expo.extra`.

La app guarda un único archivo oculto `calendar_app_data.json` en la carpeta **appData** de Drive (no aparece en la UI normal del Drive del usuario).

## Flujo típico

1. Login (Google o local)
2. Crear departamento (+ URL iCal de Airbnb opcional)
3. Importar `.ics` o pulsar **Sync URL**
4. Abrir una reserva → marcar pago, asociar contacto, notas
5. En **Ajustes** → Sincronizar Drive

## Estructura

```
app/                 Pantallas Expo Router
src/domain/          Tipos y reglas (merge ICS)
src/data/            SQLite, parser ICS, cliente Drive
src/features/auth/   Google OAuth
src/store/           Zustand
src/ui/              UI compartida
```

## Notas sobre el .ics de Airbnb

- `SUMMARY: Reserved` → reserva
- `SUMMARY: Airbnb (Not available)` → bloqueo
- `DESCRIPTION` puede traer URL de reserva y últimos 4 dígitos del teléfono
- El merge se hace por `UID`; pagos/contactos/notas locales se conservan al re-sincronizar
