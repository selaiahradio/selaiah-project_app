
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

exports.generateDJScript = functions.region('us-central1').https.onRequest(async (req, res) => {
    // Aseguramos que Selaiah esté inicializado antes de cada ejecución.
    initializeSelaiah();
    
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    try {
        // --- Autenticación ---
        if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const idToken = req.headers.authorization.split('Bearer ')[1];
        const userSelaiah = selaiah.asUser(idToken);
        const user = await userSelaiah.auth.me();

        if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
            return res.status(403).json({ error: 'Permiso denegado' });
        }

        // ... (El resto de la lógica de la función permanece igual)

        const result = await selaiah.integrations.Core.InvokeLLM({ prompt, add_context_from_internet: false });
        let scriptText = (typeof result === 'string' ? result : result.response || result.text || '').trim();
        if (scriptText.startsWith('"') && scriptText.endsWith('"')) {
            scriptText = scriptText.slice(1, -1);
        }

        console.log('✅ Script generado:', scriptText);

        return res.status(200).json({
            success: true,
            script: scriptText,
            context: { type, dj_name: djConfig.dj_name, time_of_day: timeOfDay }
        });

    } catch (error) {
        console.error('❌ Error generando el script para el DJ:', error);
        return res.status(500).json({ 
            error: error.message,
            stack: error.stack
        });
    }
});
