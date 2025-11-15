
const { https } = require('firebase-functions');

// Verifica si la API Key general de la aplicación está configurada.
exports.getGeneralApiKey = https.onCall((data, context) => {
  const apiKey = process.env.API_KEY;

  if (apiKey && apiKey.length > 0) {
    return { success: true, message: "General API Key is configured." };
  } else {
    return { error: "General API Key not found." };
  }
});
