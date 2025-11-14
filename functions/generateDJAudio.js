import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { ElevenLabsClient } from 'npm:elevenlabs@0.8.1';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    // Verificar autenticación
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return Response.json({ 
        success: false,
        error: 'No autorizado' 
      }, { status: 401 });
    }

    const { script, voice_id, voice_settings } = await req.json();

    if (!script) {
      return Response.json({ 
        success: false,
        error: 'Script es requerido' 
      }, { status: 400 });
    }

    // Obtener API key de ElevenLabs
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      console.error('❌ ELEVENLABS_API_KEY no configurada');
      return Response.json({ 
        success: false,
        error: 'ELEVENLABS_API_KEY no está configurada en los secrets del sistema.',
        solution: 'Ve a Admin → Settings → Secrets y configura ELEVENLABS_API_KEY con tu clave de elevenlabs.io'
      }, { status: 500 });
    }

    console.log('🔑 API Key encontrada:', elevenLabsApiKey.substring(0, 10) + '...');

    // Obtener configuración del DJ o usar defaults
    const configs = await base44.asServiceRole.entities.DJConfig.list();
    const djConfig = configs[0] || {};
    
    const finalVoiceId = voice_id || djConfig.voice_id || 'JBFqnCBsd6RMkjVDRZzb';
    const finalVoiceSettings = voice_settings || djConfig.voice_settings || {
      stability: 0.6,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true
    };

    console.log('🎙️ Generando audio con ElevenLabs (Nuevo SDK)...');
    console.log('📝 Script length:', script.length, 'caracteres');
    console.log('🗣️ Voice ID:', finalVoiceId);

    // Inicializar cliente de ElevenLabs
    const elevenlabs = new ElevenLabsClient({
      apiKey: elevenLabsApiKey
    });

    // Generar audio usando el nuevo SDK
    const audioStream = await elevenlabs.textToSpeech.convert(
      finalVoiceId,
      {
        text: script,
        model_id: 'eleven_multilingual_v2',
        output_format: 'mp3_44100_128',
        voice_settings: {
          stability: finalVoiceSettings.stability || 0.6,
          similarity_boost: finalVoiceSettings.similarity_boost || 0.75,
          style: finalVoiceSettings.style || 0.5,
          use_speaker_boost: finalVoiceSettings.use_speaker_boost !== false
        }
      }
    );

    console.log('📥 Audio stream recibido');

    // Convertir el stream a Uint8Array (compatible con Deno)
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    
    // Concatenar chunks usando Uint8Array
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const audioBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      audioBuffer.set(chunk, offset);
      offset += chunk.length;
    }
    
    if (!audioBuffer || audioBuffer.length === 0) {
      console.error('❌ Audio buffer vacío');
      return Response.json({ 
        success: false,
        error: 'Audio generado está vacío'
      }, { status: 500 });
    }

    // Convertir Uint8Array a base64 (método compatible con Deno)
    let binary = '';
    for (let i = 0; i < audioBuffer.length; i++) {
      binary += String.fromCharCode(audioBuffer[i]);
    }
    const audioBase64 = btoa(binary);

    const sizeKB = Math.round(audioBuffer.length / 1024);
    const estimatedDuration = Math.round(audioBuffer.length / 16000);

    console.log('✅ Audio generado exitosamente con nuevo SDK');
    console.log('📦 Tamaño:', sizeKB, 'KB');
    console.log('⏱️ Duración estimada:', estimatedDuration, 's');

    // Crear log de éxito
    try {
      await base44.asServiceRole.entities.SystemLog.create({
        log_type: 'success',
        module: 'dj_virtual',
        message: 'Audio generado con ElevenLabs (Nuevo SDK)',
        details: {
          voice_id: finalVoiceId,
          size_kb: sizeKB,
          duration_seconds: estimatedDuration,
          script_length: script.length,
          sdk_version: 'elevenlabs@0.8.1'
        }
      });
    } catch (logError) {
      console.error('No se pudo crear log de éxito:', logError.message);
    }

    return Response.json({
      success: true,
      audio_base64: audioBase64,
      content_type: 'audio/mpeg',
      size_bytes: audioBuffer.length,
      size_kb: sizeKB,
      estimated_duration_seconds: estimatedDuration,
      voice_id: finalVoiceId,
      message: `Audio generado exitosamente con nuevo SDK (${sizeKB} KB, ~${estimatedDuration}s)`
    });

  } catch (error) {
    console.error('❌ Error crítico:', error.message);
    console.error('Stack:', error.stack);
    
    // Manejar errores específicos de ElevenLabs
    let errorMessage = error.message || 'Error desconocido al generar audio';
    let solution = 'Revisa los logs del sistema en /AdminDiagnostics para más detalles';
    
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      errorMessage = 'API Key de ElevenLabs inválida o expirada';
      solution = 'Ve a elevenlabs.io/app/settings/api-keys y genera una nueva API key';
    } else if (error.message?.includes('429') || error.message?.includes('quota')) {
      errorMessage = 'Límite de caracteres de ElevenLabs alcanzado';
      solution = 'Espera a que se renueve tu cuota o actualiza tu plan en elevenlabs.io';
    } else if (error.message?.includes('voice_id')) {
      errorMessage = 'Voice ID no encontrado';
      solution = 'Verifica que el Voice ID sea correcto y exista en tu cuenta';
    }
    
    // Crear log de error crítico
    try {
      await base44.asServiceRole.entities.SystemLog.create({
        log_type: 'critical',
        module: 'dj_virtual',
        message: 'Error crítico generando audio (Nuevo SDK)',
        details: {
          error_message: String(errorMessage).substring(0, 300),
          error_name: error.name || 'Error',
          sdk_version: 'elevenlabs@0.8.1'
        }
      });
    } catch (logError) {
      console.error('No se pudo crear log crítico:', logError.message);
    }
    
    return Response.json({ 
      success: false,
      error: errorMessage,
      solution: solution
    }, { status: 500 });
  }
});