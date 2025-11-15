
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');

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

exports.generateDJAudio = functions.region('us-central1').https.onRequest(async (req, res) => {
  // Aseguramos que Selaiah esté inicializado antes de cada ejecución.
  initializeSelaiah();
  
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    // --- Autenticación de Administrador ---
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No autorizado: Token no proporcionado.' });
    }
    const idToken = req.headers.authorization.split('Bearer ')[1];
    const userSelaiah = selaiah.asUser(idToken);
    const user = await userSelaiah.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(401).json({ success: false, error: 'No autorizado para esta operación' });
    }

    // ... (El resto de la lógica de la función permanece igual)
    
    await selaiah.asServiceRole.entities.SystemLog.create({
        log_type: 'success',
        module: 'dj_virtual',
        message: 'Audio generado con ElevenLabs',
        details: { voice_id: finalVoiceId, size_kb: sizeKB, script_length: script.length }
    });

    return res.status(200).json({ success: true, /* ...otros campos... */ });

  } catch (error) {
    console.error('❌ Error crítico en generateDJAudio:', error);
    // ... (El manejo de errores permanece igual)
  }
});
