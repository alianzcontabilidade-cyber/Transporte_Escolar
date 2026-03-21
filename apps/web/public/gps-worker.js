/**
 * GPS Background Worker
 * Roda em thread separada para manter o rastreamento ativo
 * mesmo quando a aba principal está em background.
 */

let intervalId = null;
let config = null;

self.addEventListener('message', function(e) {
  const { type, data } = e.data;

  switch (type) {
    case 'START':
      config = data;
      if (intervalId) clearInterval(intervalId);
      // Enviar ping periodico para manter o worker ativo
      intervalId = setInterval(function() {
        self.postMessage({ type: 'TICK', timestamp: Date.now() });
      }, config.intervalMs || 10000);
      self.postMessage({ type: 'STARTED' });
      break;

    case 'STOP':
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      config = null;
      self.postMessage({ type: 'STOPPED' });
      break;

    case 'POSITION':
      // Recebe posicao da thread principal e pode processar
      if (config) {
        self.postMessage({
          type: 'SEND_POSITION',
          position: data,
          config: config,
        });
      }
      break;
  }
});
