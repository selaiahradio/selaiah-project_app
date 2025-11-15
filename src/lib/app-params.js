
// Simplified configuration to point to the new Firebase backend.
const serverUrl = "https://us-central1-selaiah-radio.cloudfunctions.net/api";

// Provide a default appId, as the old environment variable method is no longer used.
const appId = "app_selaiah_radio_8116342ff";

const getLegacyParam = (paramName) => {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get(paramName);
}

export const appParams = {
    appId: appId,
    serverUrl: serverUrl,
    token: getLegacyParam("access_token"),
    fromUrl: typeof window !== 'undefined' ? window.location.href : '',
    functionsVersion: getLegacyParam("functions_version"),
};
