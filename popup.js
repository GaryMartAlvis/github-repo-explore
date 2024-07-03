let accessToken = null;
let currentRepo = null;

document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.local.get(['accessToken', 'currentRepo'], function(result) {
    if (result.accessToken) {
      accessToken = result.accessToken;
      if (result.currentRepo) {
        currentRepo = result.currentRepo;
        showSearchInterface();
      } else {
        showRepoSelector();
      }
    } else {
      showLoginInterface();
    }
  });
});

function showLoginInterface() {
  document.getElementById('login-container').style.display = 'block';
  document.getElementById('repo-selector').style.display = 'none';
  document.getElementById('search-container').style.display = 'none';
}

function showRepoSelector() {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('repo-selector').style.display = 'block';
  document.getElementById('search-container').style.display = 'none';
}

function showSearchInterface() {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('repo-selector').style.display = 'none';
  document.getElementById('search-container').style.display = 'block';
  document.getElementById('current-repo').textContent = `Repositorio actual: ${currentRepo}`;
}

document.getElementById('login-button').addEventListener('click', () => {
  chrome.runtime.sendMessage({action: 'authenticate'}, (response) => {
    if (response.token) {
      accessToken = response.token;
      chrome.storage.local.set({accessToken: accessToken}, function() {
        showRepoSelector();
      });
    } else {
      alert('Error al iniciar sesión: ' + response.error);
    }
  });
});

document.getElementById('select-repo').addEventListener('click', () => {
  const repoInput = document.getElementById('repo-input').value;
  if (repoInput) {
    currentRepo = repoInput;
    chrome.storage.local.set({currentRepo: currentRepo}, function() {
      showSearchInterface();
    });
  } else {
    alert('Por favor, ingresa un repositorio válido.');
  }
});

document.getElementById('search-button').addEventListener('click', () => {
  const query = document.getElementById('search-input').value;
  if (query) {
    const [owner, repo] = currentRepo.split('/');
    searchRepo(owner, repo, query).then(results => {
      const resultDiv = document.getElementById('results');
      resultDiv.innerHTML = results.items.map(item => `<p>${item.path}: ${item.name}</p>`).join('');
    }).catch(error => {
      if (error.message === 'Token expired') {
        refreshToken();
      } else {
        alert('Error al buscar: ' + error.message);
      }
    });
  } else {
    alert('Por favor, ingresa un término de búsqueda.');
  }
});

document.getElementById('logout-button').addEventListener('click', () => {
  chrome.storage.local.remove(['accessToken', 'currentRepo'], function() {
    accessToken = null;
    currentRepo = null;
    showLoginInterface();
  });
});

function searchRepo(owner, repo, query) {
  return fetch(`https://api.github.com/search/code?q=${query}+repo:${owner}/${repo}`, {
    headers: {
      'Authorization': `token ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  .then(response => {
    if (response.status === 401) {
      throw new Error('Token expired');
    }
    if (!response.ok) {
      throw new Error('Error en la búsqueda');
    }
    return response.json();
  });
}

function refreshToken() {
  chrome.runtime.sendMessage({action: 'refreshToken'}, (response) => {
    if (response.token) {
      accessToken = response.token;
      chrome.storage.local.set({accessToken: accessToken}, function() {
        alert('Sesión renovada. Por favor, intenta la búsqueda de nuevo.');
      });
    } else {
      alert('Error al renovar la sesión. Por favor, inicia sesión de nuevo.');
      showLoginInterface();
    }
  });
}