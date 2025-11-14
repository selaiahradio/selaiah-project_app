import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    // No requiere autenticación - config pública de Google Maps
    
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!apiKey) {
      return Response.json({ 
        error: 'Google Maps no está configurado. Por favor configura la API key en el panel de administración.' 
      }, { status: 503 });
    }

    return Response.json({ apiKey });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});