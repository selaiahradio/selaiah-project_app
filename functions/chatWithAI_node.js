
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// No importamos Selaiah aquí para evitar el error de análisis.

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Inicializamos la variable aquí, pero la instancia se creará dinámicamente.
let selaiah;

function initializeSelaiah() {
    if (!selaiah) {
        // Cargamos el SDK dinámicamente para eludir el analizador de Firebase.
        const Selaiah = require('@selaiah/sdk');
        selaiah = new Selaiah({ apiKey: functions.config().selaiah.key });
    }
}

exports.chatWithAI = functions.region('us-central1').https.onRequest(async (req, res) => {
  // Aseguramos que Selaiah esté inicializado antes de cada ejecución.
  initializeSelaiah();

  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    let user = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const idToken = req.headers.authorization.split('Bearer ')[1];
      const userSelaiah = selaiah.asUser(idToken);
      user = await userSelaiah.auth.me();
    }

    const { message, context, conversation_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Falta el mensaje' });
    }

    const configs = await selaiah.asServiceRole.entities.AIConfig.list();
    const aiConfig = configs[0] || {};

    let systemContext = aiConfig.system_context || 'Eres un asistente de IA servicial.';
    if (user && user.full_name) {
      systemContext += ` El usuario se llama ${user.full_name}`;
    }

    const llmResponse = await selaiah.integrations.Core.InvokeLLM({
        prompt: message,
        system_context: systemContext,
        conversation_id: conversation_id
    });

    const responseMessage = typeof llmResponse === 'string' ? llmResponse : llmResponse.response || llmResponse.text;

    await selaiah.asServiceRole.entities.SystemLog.create({
        log_type: 'info',
        module: 'ai_chat',
        message: 'Chat procesado exitosamente',
        details: { user_email: user ? user.email : 'anonymous', message_length: message.length, response_length: responseMessage.length }
    });

    return res.status(200).json({ 
        response: responseMessage, 
        conversation_id: conversation_id 
    });

  } catch (error) {
    console.error('❌ Error en chatWithAI:', error);
    const errorMessage = error.response ? error.response.data.error : error.message;
    
    // Intentamos registrar el error incluso si la inicialización principal falló.
    try {
        initializeSelaiah();
        await selaiah.asServiceRole.entities.SystemLog.create({
            log_type: 'error',
            module: 'ai_chat',
            message: 'Error procesando chat',
            details: { error: errorMessage }
        });
    } catch (logError) {
        console.error('Error al registrar el log de errores:', logError);
    }

    return res.status(500).json({ 
        error: 'Lo siento, ocurrió un error al procesar tu mensaje.' 
    });
  }
});
