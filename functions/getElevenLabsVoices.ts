import { createClientFromRequest } from 'npm:@selaiah/sdk@1.0.0';
import { ElevenLabsClient } from 'npm:elevenlabs@0.8.1';

Deno.serve(async (req) => {
  const selaiah = createClientFromRequest(req);
  
  try {
    // Verificar autenticación
    const user = await selaiah.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return Response.json({ 
        success: false,
        error: 'No autorizado' 
      }, { status: 401 });
    }

    // Obtener API key de ElevenLabs
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      return Response.json({ 
        success: false,
        error: 'ELEVENLABS_API_KEY no está configurada',
        solution: 'Configura ELEVENLABS_API_KEY en los secrets del sistema'
      }, { status: 500 });
    }

    console.log('🔑 Listando voces de ElevenLabs...');

    // Inicializar cliente de ElevenLabs
    const elevenlabs = new ElevenLabsClient({
      apiKey: elevenLabsApiKey
    });

    // Obtener todas las voces disponibles
    const voicesResponse = await elevenlabs.voices.getAll();
    const voices = voicesResponse.voices || [];

    console.log(`✅ ${voices.length} voces encontradas`);

    // Formatear las voces para mostrar
    const formattedVoices = voices.map(voice => ({
      voice_id: voice.voice_id,
      name: voice.name,
      category: voice.category,
      labels: voice.labels || {},
      preview_url: voice.preview_url,
      description: voice.description || 'Sin descripción',
      settings: voice.settings,
      // Determinar si es apta para español
      is_multilingual: voice.labels?.language?.includes('Spanish') || 
                      voice.labels?.language?.includes('spanish') ||
                      voice.name?.toLowerCase().includes('spanish') ||
                      voice.description?.toLowerCase().includes('spanish') ||
                      voice.description?.toLowerCase().includes('español')
    }));

    // Separar voces multilingües
    const multilingualVoices = formattedVoices.filter(v => v.is_multilingual);
    const otherVoices = formattedVoices.filter(v => !v.is_multilingual);

    console.log(`🌍 ${multilingualVoices.length} voces multilingües/español encontradas`);

    return Response.json({
      success: true,
      total_voices: voices.length,
      multilingual_voices: multilingualVoices,
      other_voices: otherVoices,
      all_voices: formattedVoices,
      recommendation: multilingualVoices.length > 0 
        ? `Te recomiendo usar: ${multilingualVoices[0].name} (${multilingualVoices[0].voice_id})`
        : 'No se encontraron voces específicas para español. Usa la primera disponible.'
    });

  } catch (error) {
    console.error('❌ Error obteniendo voces:', error);
    
    let errorMessage = error.message || 'Error al obtener voces';
    let solution = 'Verifica que tu API key sea correcta';
    
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      errorMessage = 'API Key de ElevenLabs inválida';
      solution = 'Ve a elevenlabs.io/app/settings/api-keys y verifica tu API key';
    } else if (error.message?.includes('402')) {
      errorMessage = 'Cuenta sin créditos o plan inactivo';
      solution = 'Verifica tu plan en elevenlabs.io/app/subscription';
    }
    
    return Response.json({ 
      success: false,
      error: errorMessage,
      solution: solution,
      details: error.stack
    }, { status: 500 });
  }
});