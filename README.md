# Selaiah Radio Project App

Esta es la aplicación web para Selaiah Radio.

## Cambios Recientes: Refactorización de Autenticación

Se ha realizado una refactorización completa del sistema de autenticación para eliminar la dependencia de `base44` y utilizar una API de backend propia para un flujo de inicio de sesión más robusto y seguro.

Los cambios clave incluyen:

*   **Eliminación de `base44`:** Toda la lógica de autenticación que dependía de `base44` ha sido eliminada.
*   **Nuevo Módulo de API (`src/lib/api.js`):** Se ha creado un nuevo archivo para centralizar toda la comunicación con el backend. Este módulo gestiona:
    *   El envío de enlaces mágicos (`sendMagicLink`).
    *   La redirección para el inicio de sesión con Google (`redirectToGoogleLogin`).
    *   La obtención de los datos del usuario autenticado (`getMe`).
*   **Actualización del Contexto de Autenticación (`src/lib/AuthContext.jsx`):** El `AuthContext` ha sido modificado para utilizar el nuevo `api.js`, verificando el estado del usuario contra el endpoint `/users/me`.
*   **Página de Inicio de Sesión Actualizada (`src/pages/Login.jsx`):** La página de inicio de sesión ahora utiliza las funciones del módulo `api.js` para gestionar los inicios de sesión con correo electrónico (enlace mágico) y Google.

## Guía de Instalación y Despliegue

Sigue estas instrucciones para configurar, ejecutar y desplegar la aplicación.

### 1. Instalación de Dependencias

Para instalar todas las dependencias del proyecto, ejecuta el siguiente comando en la raíz del proyecto:

```bash
npm install
```

### 2. Ejecutar en Modo de Desarrollo

Para iniciar el servidor de desarrollo local, ejecuta:

```bash
npm run dev
```

Esto iniciará la aplicación en `http://localhost:5173`.

### 3. Construir para Producción

Antes de desplegar, necesitas construir la aplicación para producción. Este comando optimizará y empaquetará los archivos en la carpeta `dist/`.

```bash
npm run build
```

### 4. Despliegue en Firebase Hosting

Este proyecto está configurado para ser desplegado en Firebase Hosting.

Una vez que hayas construido el proyecto (paso 3), puedes desplegarlo ejecutando el siguiente comando de la CLI de Firebase:

```bash
firebase deploy --only hosting
```

**Nota:** Asegúrate de tener la [CLI de Firebase](https://firebase.google.com/docs/cli) instalada y de haber iniciado sesión (`firebase login`) en la cuenta correcta.
