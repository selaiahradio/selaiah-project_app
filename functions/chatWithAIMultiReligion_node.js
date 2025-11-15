
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

exports.chatWithAIMultiReligion = functions.region('us-central1').https.onRequest(async (req, res) => {
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
      try {
        const idToken = req.headers.authorization.split('Bearer ')[1];
        const userSelaiah = selaiah.asUser(idToken);
        user = await userSelaiah.auth.me();
      } catch (error) {
        console.log('Token presente pero inválido, continuando como usuario público');
      }
    }

    const { message, context, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    const detection = detectReligionAndLanguage(message, conversationHistory, user);
    const systemContext = buildMultiReligiousContext(detection, user);
    const userAnalysis = analyzeUserIntent(message, conversationHistory);

    let conversationMessages = [
      { role: "system", content: systemContext }
    ];

    if (conversationHistory.length > 0) {
      conversationHistory.slice(-8).forEach(msg => {
        conversationMessages.push({
          role: msg.sender_email === user?.email ? "user" : "assistant",
          content: msg.message
        });
      });
    }

    const enhancedMessage = userAnalysis.needsScripture 
      ? `${message}\n\n[El usuario está buscando referencias de textos sagrados. Si mencionas un versículo, incluye la referencia exacta (ej: Juan 3:16, Corán 2:255, etc.)]`
      : message;

    conversationMessages.push({ role: "user", content: enhancedMessage });

    const response = await selaiah.integrations.Core.InvokeLLM({
      prompt: conversationMessages.map(m => 
        `${m.role === 'system' ? 'SISTEMA' : m.role === 'user' ? 'USUARIO' : 'ASISTENTE'}: ${m.content}`
      ).join('\n\n'),
      add_context_from_internet: userAnalysis.needsExternalInfo
    });

    const aiMessage = typeof response === 'string' ? response : response.response || response.text || '';

    const scriptureMentions = extractScriptureReferences(aiMessage, detection.religion);
    let enrichedMessage = aiMessage;
    
    if (scriptureMentions.length > 0) {
      const scriptureTexts = await fetchScripturesFromAPIs(scriptureMentions, detection);
      enrichedMessage = enrichScriptureReferences(aiMessage, scriptureTexts);
    }

    if (user && detection.confidence > 0.75) {
      try {
        await selaiah.asServiceRole.entities.User.update(user.id, {
          ai_detection: {
            detected_religion: detection.religion,
            religion_confidence: detection.religionConfidence,
            detected_language: detection.language,
            language_confidence: detection.languageConfidence,
            spiritual_level: userAnalysis.spiritualLevel,
            last_updated: new Date().toISOString()
          }
        });
      } catch (updateError) {
        console.log('No se pudo actualizar detección:', updateError.message);
      }
    }

    await selaiah.asServiceRole.entities.SystemLog.create({
      log_type: 'info',
      module: 'ai_chat_multi_religion',
      message: 'Chat multi-religioso procesado',
      details: {
        user_email: user?.email || 'anonymous',
        detected_religion: detection.religion,
        detected_language: detection.language,
        confidence: detection.confidence,
        spiritual_level: userAnalysis.spiritualLevel,
        intent: userAnalysis.intent,
        message_length: message.length,
        response_length: enrichedMessage.length,
        scriptures_found: scriptureMentions.length
      }
    });

    return res.status(200).json({
      success: true,
      message: enrichedMessage.trim(),
      metadata: {
        detected_religion: detection.religion,
        detected_language: detection.language,
        confidence: detection.confidence,
        spiritual_level: userAnalysis.spiritualLevel,
        scriptures_included: scriptureMentions.length > 0
      }
    });

  } catch (error) {
    console.error('❌ Error en chatWithAIMultiReligion:', error);
    const errorMessage = error.response ? error.response.data.error : error.message;
    return res.status(500).json({ 
      error: errorMessage,
      message: "Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo."
    });
  }
});

// Funciones auxiliares (sin cambios)
function detectReligionAndLanguage(message, history, user) { /* ... */ }
function buildMultiReligiousContext(detection, user) { /* ... */ }
function analyzeUserIntent(message, history) { /* ... */ }
function extractScriptureReferences(text, religion) { /* ... */ }
async function fetchScripturesFromAPIs(references, detection) { /* ... */ }
async function fetchBibleVerse(ref, language) { /* ... */ }
async function fetchQuranVerse(ref, language) { /* ... */ }
function enrichScriptureReferences(aiMessage, scriptureTexts) { /* ... */ }
