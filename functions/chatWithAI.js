import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticación
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { message, context, departmentId, conversationHistory } = await req.json();

    if (!message) {
      return Response.json({ error: 'Mensaje requerido' }, { status: 400 });
    }

    // Obtener información del departamento si se especifica
    let departmentContext = '';
    if (departmentId) {
      try {
        const department = await base44.asServiceRole.entities.SupportDepartment.filter({ id: departmentId });
        if (department[0]) {
          departmentContext = `\nDepartamento: ${department[0].name}\nContexto específico: ${department[0].ai_context || ''}`;
          
          if (department[0].knowledge_base && department[0].knowledge_base.length > 0) {
            departmentContext += `\n\nBase de conocimiento:\n${department[0].knowledge_base.map(kb => 
              `P: ${kb.question}\nR: ${kb.answer}`
            ).join('\n\n')}`;
          }
        }
      } catch (error) {
        console.log('No se pudo cargar el departamento:', error.message);
      }
    }

    // Construir el contexto del sistema
    const systemContext = `Eres un asistente de soporte para SELAIAH RADIO, una radio cristiana pentecostal 24/7.

## Información del Sistema

SELAIAH RADIO es una plataforma completa de radio cristiana con las siguientes características:

### Streaming y Audio
- Radio en vivo 24/7 con música cristiana pentecostal
- Sistema Now Playing en tiempo real con RadioBoss Cloud
- Múltiples configuraciones de streams (MP3, AAC, OGG)
- Gestión de calidad (64kbps a 320kbps)
- DJ Virtual con IA usando ElevenLabs + OpenAI

### Contenido
- Programas radiales (Shows) con horarios y DJs
- Radio Jockeys con perfiles completos
- Blog con artículos y testimonios
- Biblia digital con versículos pentecostales
- Eventos cristianos (conciertos, conferencias)
- Charts musicales semanales

### Comunicación
- Notificaciones Push con Firebase Cloud Messaging
- Sistema de mensajería entre usuarios
- Red social cristiana con posts, comentarios y reacciones
- Noticias locales basadas en geolocalización

### Comercio
- Tienda online con merchandise cristiano
- Sistema de donaciones
- Procesamiento de pagos
- Gestión de órdenes

### Roles y Permisos
- user: Usuario básico
- verified_user: Usuario verificado religiosamente (nivel 20+)
- admin: Administrador general (nivel 80)
- superadmin: Acceso total (nivel 100)

### Integraciones
- Amazon Alexa (comando de voz)
- Apple Siri / CarPlay
- Google Assistant
- Spotify, TuneIn
- Firebase Cloud Messaging
- Google Maps API
- OpenAI GPT-4
- ElevenLabs (Text-to-Speech)
- RadioBoss Cloud

### Verificación Religiosa
Los usuarios pueden verificar su identidad religiosa completando ejercicios:
- Quiz bíblico
- Tests de doctrina pentecostal
- Testimonios
- Memorización de escrituras
- Al completar obtienen permisos adicionales (crear eventos, versículos, etc.)

### Características Técnicas
- Plataforma: Base44 (React, Tailwind CSS, Deno)
- Base de datos: NoSQL (Base44 Database)
- Backend: Funciones serverless en Deno
- Frontend: React 18 con React Query
- Streaming: RadioBoss Cloud / AzuraCast / Icecast / Shoutcast

${departmentContext}

## Tu Rol
- Responde en español latino natural y amigable
- Sé breve y directo (máximo 3-4 oraciones por respuesta)
- Proporciona soluciones prácticas paso a paso
- Si no sabes algo, admítelo y sugiere contactar al soporte humano
- Sé empático y pentecostal en tu tono
- NUNCA inventes información técnica si no estás seguro

## Usuario actual
- Nombre: ${user.full_name}
- Email: ${user.email}
- Rol: ${user.role}

Responde la pregunta del usuario de manera útil y concisa:`;

    // Construir el historial de conversación
    let conversationMessages = [
      {
        role: "system",
        content: systemContext
      }
    ];

    // Agregar historial si existe
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        conversationMessages.push({
          role: msg.sender_email === user.email ? "user" : "assistant",
          content: msg.message
        });
      });
    }

    // Agregar el mensaje actual
    conversationMessages.push({
      role: "user",
      content: message
    });

    // Llamar a OpenAI
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: conversationMessages.map(m => `${m.role === 'system' ? 'SISTEMA' : m.role === 'user' ? 'USUARIO' : 'ASISTENTE'}: ${m.content}`).join('\n\n'),
      add_context_from_internet: false
    });

    const aiMessage = typeof response === 'string' ? response : response.response || response.text || '';

    // Registrar en logs
    await base44.asServiceRole.entities.SystemLog.create({
      log_type: 'info',
      module: 'ai_chat',
      message: 'Chat con IA procesado',
      details: {
        user_email: user.email,
        department_id: departmentId,
        message_length: message.length,
        response_length: aiMessage.length
      }
    });

    return Response.json({
      success: true,
      message: aiMessage.trim(),
      metadata: {
        department: departmentId,
        user: user.email
      }
    });

  } catch (error) {
    console.error('❌ Error en chatWithAI:', error);
    return Response.json({ 
      error: error.message,
      message: "Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo."
    }, { status: 500 });
  }
});