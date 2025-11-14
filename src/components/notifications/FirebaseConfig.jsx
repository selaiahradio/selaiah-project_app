import { useState, useEffect } from "react";

// Configuración de Firebase - Las variables se cargarán del backend
let firebaseConfig = null;
let messaging = null;
let isFirebaseInitialized = false;

// Función para inicializar Firebase
export const initializeFirebase = async () => {
  if (isFirebaseInitialized) return messaging;

  try {
    // Importar Firebase dinámicamente
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
    const { getMessaging, onMessage } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js");

    // Obtener configuración del backend
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
      throw new Error("No se pudo obtener la configuración de Firebase");
    }

    firebaseConfig = await response.json();

    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    isFirebaseInitialized = true;

    // Configurar listener para mensajes en primer plano
    onMessage(messaging, (payload) => {
      console.log('Mensaje recibido en primer plano:', payload);
      
      // Mostrar notificación personalizada
      if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.icon || '/icon-192.png',
          image: payload.notification.image,
          badge: '/icon-96.png',
          tag: 'selaiah-radio',
          requireInteraction: false,
        });
      }
    });

    return messaging;
  } catch (error) {
    console.error("Error inicializando Firebase:", error);
    return null;
  }
};

// Hook para gestionar notificaciones push
export const useFirebaseMessaging = () => {
  const [token, setToken] = useState(null);
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Verificar si el navegador soporta notificaciones
    const supported = typeof window !== 'undefined' && 
                     'Notification' in window && 
                     'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') {
      setError("Notificaciones no soportadas en este navegador");
      return false;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      return perm === "granted";
    } catch (err) {
      setError("Error solicitando permisos");
      return false;
    }
  };

  const getToken = async () => {
    if (typeof Notification === 'undefined') {
      setError("Notificaciones no soportadas");
      return null;
    }

    try {
      const messaging = await initializeFirebase();
      if (!messaging) {
        throw new Error("Firebase Messaging no está disponible");
      }

      const { getToken: getFCMToken } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js");

      // Obtener VAPID key del backend
      const configResponse = await fetch('/api/firebase-config');
      const config = await configResponse.json();

      const currentToken = await getFCMToken(messaging, {
        vapidKey: config.vapidKey
      });

      if (currentToken) {
        setToken(currentToken);
        return currentToken;
      } else {
        throw new Error("No se pudo obtener el token");
      }
    } catch (err) {
      console.error("Error obteniendo token:", err);
      setError(err.message);
      return null;
    }
  };

  const subscribe = async (base44Client, topics = []) => {
    if (typeof Notification === 'undefined') {
      return { success: false, error: "Notificaciones no soportadas en este navegador" };
    }

    try {
      if (permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) {
          throw new Error("Permisos de notificación denegados");
        }
      }

      const deviceToken = await getToken();
      if (!deviceToken) {
        throw new Error("No se pudo obtener el token del dispositivo");
      }

      // Guardar suscripción en la base de datos
      await base44Client.entities.PushSubscription.create({
        device_token: deviceToken,
        device_type: "web",
        topics: topics,
        is_active: true,
        last_used: new Date().toISOString()
      });

      return { success: true, token: deviceToken };
    } catch (err) {
      console.error("Error suscribiéndose:", err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const unsubscribe = async (base44Client) => {
    try {
      if (token) {
        // Eliminar suscripción de la base de datos
        const subscriptions = await base44Client.entities.PushSubscription.filter({
          device_token: token,
          created_by: (await base44Client.auth.me()).email
        });

        for (const sub of subscriptions) {
          await base44Client.entities.PushSubscription.delete(sub.id);
        }

        setToken(null);
      }
      return { success: true };
    } catch (err) {
      console.error("Error desuscribiéndose:", err);
      return { success: false, error: err.message };
    }
  };

  return {
    token,
    permission,
    error,
    isSupported,
    requestPermission,
    getToken,
    subscribe,
    unsubscribe
  };
};

export default useFirebaseMessaging;