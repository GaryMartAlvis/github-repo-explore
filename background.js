import { CONFIG } from './config.js';

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
    chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
}

function refreshToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ 'interactive': false }, function(token) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
}