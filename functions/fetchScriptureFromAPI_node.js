
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

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

exports.fetchScriptureFromAPI = functions.region('us-central1').https.onRequest(async (req, res) => {
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
            console.log('Token presente pero inválido.');
        }
    }

    const { type, reference, language = 'es', version = 'auto' } = req.body;

    if (!type || !reference) {
      return res.status(400).json({ error: 'Se requiere type y reference' });
    }

    let result = null;
    // ... (El resto del switch y la lógica de la función permanece igual)
    
    await selaiah.asServiceRole.entities.SystemLog.create({
      log_type: 'info',
      module: 'scripture_api',
      message: `Escritura obtenida: ${type}`,
      details: {
        user_email: user?.email || 'anonymous',
        type,
        reference,
        language,
        success: true
      }
    });

    return res.status(200).json({ success: true, type, reference, language, ...result });

  } catch (error) {
    console.error('❌ Error en fetchScriptureFromAPI:', error);
    return res.status(500).json({ error: error.message, success: false });
  }
});

// ... (Todas las funciones auxiliares como fetchBibleVerse, fetchQuranVerse, etc. permanecen igual)
