
const { https } = require('firebase-functions');

// Verifica si la contraseña FTP de RadioBoss está configurada.
exports.getRadioBossConfig = https.onCall((data, context) => {
  const password = process.env.RADIOBOSS_FTP_PASSWORD;

  if (password && password.length > 0) {
    return { success: true, message: "RadioBoss FTP Password is configured." };
  } else {
    return { error: "RadioBoss FTP Password not found." };
  }
});
