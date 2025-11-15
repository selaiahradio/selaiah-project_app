
const { https } = require('firebase-functions');

// Verifica si la API Key de ElevenLabs está configurada.
exports.getElevenLabsConfig = https.onCall((data, context) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (apiKey && apiKey.length > 0) {
    return { success: true, message: "ElevenLabs API Key is configured." };
  } else {
    return { error: "ElevenLabs API Key not found." };
  }
});
