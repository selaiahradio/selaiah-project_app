
const { https } = require('firebase-functions');

// Esta función verifica si la API Key de OpenAI está configurada en las variables de entorno.
exports.getOpenAIConfig = https.onCall((data, context) => {
  // Asegurarse de que el usuario esté autenticado (opcional pero recomendado)
  // if (!context.auth) {
  //   throw new https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  // }

  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey && apiKey.length > 0) {
    // No devolvemos la clave, solo una confirmación de que existe.
    return { success: true, message: "OpenAI API Key is configured." };
  } else {
    // Devolvemos un error que el frontend puede interpretar.
    return { error: "OpenAI API Key not found." };
  }
});
