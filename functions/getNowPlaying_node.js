
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

exports.getNowPlaying = functions.region('us-central1').https.onRequest(async (req, res) => {
    // Aseguramos que Selaiah esté inicializado antes de cada ejecución.
    initializeSelaiah();
    
    res.set('Access-Control-Allow-Origin', '*'); // Permitir acceso CORS

    try {
        const configs = await selaiah.asServiceRole.entities.StreamConfig.filter({ is_active: true, is_primary: true });

        if (!configs || configs.length === 0) {
            return res.status(404).json({ error: 'No hay una configuración de stream activa y primaria.' });
        }

        const streamConfig = configs[0];

        // --- MÉTODO 1: AzuraCast API (Preferido) ---
        if (streamConfig.azuracast_api_url && streamConfig.azuracast_station_id) {
            try {
                const azuracastUrl = `${streamConfig.azuracast_api_url}/station/${streamConfig.azuracast_station_id}/nowplaying`;
                const response = await fetch(azuracastUrl);
                if (!response.ok) throw new Error(`Error en API de AzuraCast: ${response.status}`);
                
                const data = await response.json();
                const nowPlaying = {
                    song_title: data.now_playing?.song?.title || 'SELAIAH RADIO',
                    artist: data.now_playing?.song?.artist || 'Radio Cristiana',
                    album: data.now_playing?.song?.album || null,
                    cover_art_url: data.now_playing?.song?.art || null,
                    listeners: data.listeners?.current || 0,
                    stream_id: streamConfig.id
                };

                // Opcional: Guardar en la BD (no bloquea la respuesta)
                selaiah.asServiceRole.entities.NowPlaying.create(nowPlaying).catch(console.error);

                return res.status(200).json({ success: true, data: nowPlaying, source: 'azuracast' });
            } catch (azuraError) {
                console.error('Error consultando AzuraCast, intentando siguiente método:', azuraError.message);
            }
        }

        // --- MÉTODO 2: Metadata del Stream (ICY) ---
        if (streamConfig.stream_url) {
            try {
                const streamResponse = await fetch(streamConfig.stream_url, { headers: { 'Icy-MetaData': '1' } });
                const nowPlaying = {
                    song_title: streamResponse.headers.get('icy-name') || 'EN VIVO',
                    artist: streamResponse.headers.get('icy-description') || 'SELAIAH RADIO',
                    album: streamResponse.headers.get('icy-genre') || 'Radio Cristiana',
                    stream_id: streamConfig.id
                };
                return res.status(200).json({ success: true, data: nowPlaying, source: 'stream_metadata' });
            } catch (streamError) {
                console.error('Error obteniendo metadata del stream, intentando siguiente método:', streamError.message);
            }
        }

        // --- MÉTODO 3: Caché de la Base de Datos ---
        const recentPlaying = await selaiah.asServiceRole.entities.NowPlaying.filter(
            { stream_id: streamConfig.id }, "-created_date", 1
        );
        if (recentPlaying && recentPlaying.length > 0) {
            return res.status(200).json({ success: true, data: recentPlaying[0], source: 'cached' });
        }

        // --- MÉTODO 4: Información por Defecto ---
        const defaultData = {
            song_title: 'SELAIAH RADIO',
            artist: 'Radio Cristiana',
            album: 'Transmitiendo 24/7',
            cover_art_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6907896c4b6e76c26b9db5e8/8116342ff_IMG-20251102-WA0000.jpg',
            stream_id: streamConfig.id
        };
        return res.status(200).json({ success: true, data: defaultData, source: 'default' });

    } catch (error) {
        console.error('❌ Error general en getNowPlaying:', error);
        return res.status(500).json({ error: error.message });
    }
});
