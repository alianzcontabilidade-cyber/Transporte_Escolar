/**
 * NoSleep - Impede a tela de desligar no mobile
 *
 * Tecnica: reproduz um video invisivel em loop que forca o browser
 * a manter a tela ativa. Funciona no Android Chrome e iOS Safari.
 *
 * Combinado com Wake Lock API para cobertura maxima.
 */

let noSleepVideo: HTMLVideoElement | null = null;
let wakeLock: any = null;
let isEnabled = false;

// Video base64 minimo (1x1 pixel, 1 segundo, silencioso)
const NOSLEEP_VIDEO = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAAhtZGF0AAAA0m1vb3YAAABsbXZoZAAAAAAAAAAAAAAAAAAAA+gAAABkAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAABidWR0YQAAAFptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAC1pbHN0AAAAJal0b28AAAAdZGF0YQAAAAEAAAAAB0FwcGxl';

function createVideo(): HTMLVideoElement {
  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.setAttribute('loop', '');
  video.setAttribute('title', 'GPS ativo');
  video.style.position = 'fixed';
  video.style.top = '-1px';
  video.style.left = '-1px';
  video.style.width = '1px';
  video.style.height = '1px';
  video.style.opacity = '0.01';
  video.style.pointerEvents = 'none';
  video.style.zIndex = '-1';

  // Usar um canvas como source (mais confiavel que base64 video)
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 1, 1);
  }

  // Capturar stream do canvas
  try {
    const stream = canvas.captureStream(1);
    video.srcObject = stream;
  } catch {
    // Fallback: usar source vazia
    video.src = NOSLEEP_VIDEO;
  }

  video.muted = true;
  return video;
}

export async function enableNoSleep(): Promise<boolean> {
  if (isEnabled) return true;

  try {
    // 1. Tentar Wake Lock API primeiro (mais limpo)
    if ('wakeLock' in navigator) {
      try {
        wakeLock = await (navigator as any).wakeLock.request('screen');
        wakeLock.addEventListener('release', () => {
          // Re-acquire on release (ex: quando volta do background)
          if (isEnabled) {
            setTimeout(() => enableNoSleep(), 1000);
          }
        });
      } catch {
        // Wake Lock negado - usar fallback video
      }
    }

    // 2. Video NoSleep como fallback/complemento
    if (!noSleepVideo) {
      noSleepVideo = createVideo();
      document.body.appendChild(noSleepVideo);
    }

    try {
      await noSleepVideo.play();
    } catch {
      // Auto-play bloqueado - precisa de interacao do usuario
      // O video sera iniciado no proximo clique
      document.addEventListener('click', function startOnClick() {
        noSleepVideo?.play().catch(() => {});
        document.removeEventListener('click', startOnClick);
      }, { once: true });
    }

    isEnabled = true;
    return true;
  } catch {
    return false;
  }
}

export function disableNoSleep() {
  isEnabled = false;

  if (wakeLock) {
    try { wakeLock.release(); } catch {}
    wakeLock = null;
  }

  if (noSleepVideo) {
    noSleepVideo.pause();
    if (noSleepVideo.parentNode) {
      noSleepVideo.parentNode.removeChild(noSleepVideo);
    }
    noSleepVideo = null;
  }
}

export function isNoSleepEnabled(): boolean {
  return isEnabled;
}

// Re-acquire wake lock quando a pagina volta ao foco
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isEnabled) {
      enableNoSleep();
    }
  });
}
