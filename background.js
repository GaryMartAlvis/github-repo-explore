chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'authenticate') {
    authenticate().then(token => sendResponse({token})).catch(error => sendResponse({error: error.message}));
    return true;
  } else if (request.action === 'refreshToken') {
    refreshToken().then(token => sendResponse({token})).catch(error => sendResponse({error: error.message}));
    return true;
  }
});

function authenticate() {
  return new Promise((resolve, reject) => {
    const authUrl = 'https://github.com/login/oauth/authorize?' +
      'client_id=' + CONFIG.CLIENT_ID +
      '&redirect_uri=' + encodeURIComponent(CONFIG.REDIRECT_URL) +
      '&scope=repo';

    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    }, (redirectUrl) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        const code = new URL(redirectUrl).searchParams.get('code');
        getAccessToken(code).then(resolve).catch(reject);
      }
    });
  });
}

function getAccessToken(code) {
  return fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: CONFIG.CLIENT_ID,
      client_secret: CONFIG.CLIENT_SECRET,
      code: code
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      throw new Error(data.error_description || 'Error al obtener el token de acceso');
    }
    return data.access_token;
  });
}

function refreshToken() {
  // GitHub no proporciona un método directo para refrescar tokens.
  // En su lugar, debemos realizar una nueva autenticación.
  return authenticate();
}