
// Este archivo es el punto de entrada para todas las Cloud Functions.
// A medida que convirtamos cada función de Deno a Node.js, la importaremos aquí.

const chatWithAIFunction = require('./chatWithAI_node.js');
const chatWithAIMultiReligionFunction = require('./chatWithAIMultiReligion_node.js');
const fetchScriptureFromAPIFunction = require('./fetchScriptureFromAPI_node.js');
const generateDJAudioFunction = require('./generateDJAudio_node.js');
const generateDJScriptFunction = require('./generateDJScript_node.js');
const getNowPlayingFunction = require('./getNowPlaying_node.js');

// Nuevas funciones para verificar secrets
const getFirebaseConfig = require('./getFirebaseConfig.js');
const getGoogleMapsConfig = require('./getGoogleMapsConfig.js');
const getOpenAIConfig = require('./getOpenAIConfig.js');
const getElevenLabsConfig = require('./getElevenLabsConfig.js');
const getRadioBossConfig = require('./getRadioBossConfig.js');
const getGeneralApiKey = require('./getGeneralApiKey.js');


// Exportamos las funciones para que Firebase las pueda desplegar.
exports.chatWithAI = chatWithAIFunction.chatWithAI;
exports.chatWithAIMultiReligion = chatWithAIMultiReligionFunction.chatWithAIMultiReligion;
exports.fetchScriptureFromAPI = fetchScriptureFromAPIFunction.fetchScriptureFromAPI;
exports.generateDJAudio = generateDJAudioFunction.generateDJAudio;
exports.generateDJScript = generateDJScriptFunction.generateDJScript;
exports.getNowPlaying = getNowPlayingFunction.getNowPlaying;

// Exportamos las nuevas funciones
exports.getFirebaseConfig = getFirebaseConfig.getFirebaseConfig;
exports.getGoogleMapsConfig = getGoogleMapsConfig.getGoogleMapsConfig;
exports.getOpenAIConfig = getOpenAIConfig.getOpenAIConfig;
exports.getElevenLabsConfig = getElevenLabsConfig.getElevenLabsConfig;
exports.getRadioBossConfig = getRadioBossConfig.getRadioBossConfig;
exports.getGeneralApiKey = getGeneralApiKey.getGeneralApiKey;
