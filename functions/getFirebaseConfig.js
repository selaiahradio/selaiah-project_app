import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    // No requiere autenticación - config pública de Firebase
    
    const config = {
      apiKey: Deno.env.get('FIREBASE_API_KEY'),
      authDomain: Deno.env.get('FIREBASE_AUTH_DOMAIN'),
      projectId: Deno.env.get('FIREBASE_PROJECT_ID'),
      storageBucket: Deno.env.get('FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: Deno.env.get('FIREBASE_MESSAGING_SENDER_ID'),
      appId: Deno.env.get('FIREBASE_APP_ID'),
      vapidKey: Deno.env.get('FIREBASE_VAPID_KEY')
    };

    // Verificar que al menos las claves críticas estén presentes
    if (!config.apiKey || !config.projectId) {
      return Response.json({ 
        error: 'Firebase no está configurado. Por favor configura las API keys en el panel de administración.' 
      }, { status: 503 });
    }

    return Response.json(config);

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});