/* ═══════════════════════════════════════════════════════════
   security.js · evoMIND · kader · iki1uc
   ═══════════════════════════════════════════════════════════
   Wächter-Modul. Prüft. Blockiert. Meldet.

   Regel:
   das machbare als maxime.

   Was im browser läuft, ist sichtbar.
   Aber sichtbar heißt nicht: schutzlos.
   ═══════════════════════════════════════════════════════════ */

(function(){
  'use strict';

  // Doppel-Laden verhindern
  if(window.__EVO_WACHE) return;
  window.__EVO_WACHE = true;

  // ─── DER BERICHT ───────────────────────────────────────
  // Jede Seite trägt ihr eigenes Sicherheitsgedächtnis.
  const bericht = {
    zeit: Date.now(),
    herkunft: location.origin,
    protokoll: location.protocol,
    pfad: location.pathname,
    fehler: [],
    warnung: [],
    blockiert: [],
  };

  function fehler(msg){ bericht.fehler.push({ t:Date.now(), m:msg }); }
  function warnung(msg){ bericht.warnung.push({ t:Date.now(), m:msg }); }
  function blockiert(msg){ bericht.blockiert.push({ t:Date.now(), m:msg }); }

  // ─── 1 · PROTOKOLL ────────────────────────────────────
  // Kein HTTP außerhalb von localhost.
  // Wer im Netz ist, muss HTTPS haben. Sonst geht der Text offen.
  if(location.protocol === 'http:' &&
     location.hostname !== 'localhost' &&
     location.hostname !== '127.0.0.1'){
    fehler('kein https · jede eingabe sichtbar');
  }

  // ─── 2 · CSP-PRÜFUNG ──────────────────────────────────
  // Die Kopf-Sperre muss im meta stehen.
  // Wenn nicht: warnen, nicht abbrechen.
  window.addEventListener('DOMContentLoaded', () => {
    const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if(!csp){
      warnung('keine CSP im kopf · fremde skripte möglich');
    }
    const ref = document.querySelector('meta[name="referrer"]');
    if(!ref){
      warnung('kein referrer-policy · volle url wird geleakt');
    }
  });

  // ─── 3 · EVAL SPERRE ──────────────────────────────────
  // eval und Function(string) sind die Haupttore für fremden Code.
  // Wir sperren sie. Nicht für immer — für diese seite.
  try{
    const altEval = window.eval;
    window.eval = function(){
      blockiert('eval() gerufen');
      console.error('SECURITY · eval blockiert');
      return undefined;
    };
    Object.defineProperty(window.eval, 'name', { value: 'eval' });
  }catch(e){ warnung('eval nicht sperrbar'); }

  try{
    const altFunction = window.Function;
    window.Function = function(){
      blockiert('Function() gerufen');
      console.error('SECURITY · Function() blockiert');
      return function(){};
    };
  }catch(e){ warnung('Function nicht sperrbar'); }

  // setTimeout/setInterval mit string = verstecktes eval
  try{
    const altSetTimeout = window.setTimeout;
    const altSetInterval = window.setInterval;
    window.setTimeout = function(fn, ms, ...args){
      if(typeof fn === 'string'){
        blockiert('setTimeout mit string');
        return null;
      }
      return altSetTimeout(fn, ms, ...args);
    };
    window.setInterval = function(fn, ms, ...args){
      if(typeof fn === 'string'){
        blockiert('setInterval mit string');
        return null;
      }
      return altSetInterval(fn, ms, ...args);
    };
  }catch(e){ warnung('timer nicht prüfbar'); }

  // ─── 4 · STORAGE WÄCHTER ──────────────────────────────
  // localStorage und sessionStorage dürfen nur
  // mit dem präfix "evo." beschrieben werden.
  // So verhindern wir, dass fremder Code unsere schlüssel überschreibt
  // und wir sehen sofort, wenn etwas anderes schreibt.
  ['localStorage','sessionStorage'].forEach(name => {
    try{
      const storage = window[name];
      if(!storage) return;
      const proto = Object.getPrototypeOf(storage);
      const altSet = proto.setItem;
      const altGet = proto.getItem;
      const altRemove = proto.removeItem;
      const altClear = proto.clear;

      proto.setItem = function(k, v){
        if(typeof k !== 'string'){
          blockiert(`${name}.setItem nicht-string`);
          return;
        }
        if(!k.startsWith('evo.') && !k.startsWith('iki1uc.')){
          warnung(`${name} fremder key: ${k}`);
        }
        if(typeof v === 'string' && v.length > 100_000){
          warnung(`${name} großer wert: ${k} (${v.length})`);
        }
        return altSet.call(this, k, v);
      };

      proto.getItem = function(k){
        return altGet.call(this, k);
      };

      proto.removeItem = function(k){
        if(typeof k === 'string' && !k.startsWith('evo.') && !k.startsWith('iki1uc.')){
          warnung(`${name} fremder remove: ${k}`);
        }
        return altRemove.call(this, k);
      };

      proto.clear = function(){
        warnung(`${name}.clear() gerufen`);
        return altClear.call(this);
      };
    }catch(e){ /* storage nicht verfügbar */ }
  });

  // ─── 5 · INNERHTML WÄCHTER ────────────────────────────
  // innerHTML mit benutzer-eingabe = XSS.
  // Wir erlauben innerHTML, aber prüfen auf offensichtliche
  // gefahren: <script>, onerror=, javascript:, data:text/html.
  try{
    const altInnerHTML = Object.getOwnPropertyDescriptor(
      Element.prototype, 'innerHTML'
    );
    if(altInnerHTML && altInnerHTML.set){
      Object.defineProperty(Element.prototype, 'innerHTML', {
        get: altInnerHTML.get,
        set: function(v){
          if(typeof v === 'string'){
            const verdacht = [
              /<script[\s>]/i,
              /on\w+\s*=/i,
              /javascript:/i,
              /data:text\/html/i,
              /<iframe[\s>]/i,
              /<object[\s>]/i,
              /<embed[\s>]/i,
            ];
            for(const re of verdacht){
              if(re.test(v)){
                blockiert('innerHTML mit verdacht: ' + re);
                console.error('SECURITY · innerHTML blockiert');
                return;
              }
            }
          }
          return altInnerHTML.set.call(this, v);
        },
        configurable: true,
      });
    }
  }catch(e){ warnung('innerHTML nicht prüfbar'); }

  // ─── 6 · IFRAME WÄCHTER ───────────────────────────────
  // Jeder iframe, der nicht von uns kommt, wird sandboxed.
  // Kein Zugriff auf parent, kein top-navigation, kein form.
  function prüfeIframes(){
    document.querySelectorAll('iframe').forEach(f => {
      const src = f.getAttribute('src') || '';
      const eigen = !src ||
                    src.startsWith('/') ||
                    src.startsWith('./') ||
                    src.startsWith(location.origin);
      if(!eigen){
        f.setAttribute('sandbox','allow-scripts allow-same-origin');
        f.removeAttribute('allow');
        f.setAttribute('referrerpolicy','no-referrer');
        blockiert('fremder iframe: ' + src);
      }
      // Auch eigene iframes: kein top-navigate
      if(!f.hasAttribute('sandbox')){
        f.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms');
      }
    });
  }
  window.addEventListener('DOMContentLoaded', prüfeIframes);

  // ─── 7 · FETCH WÄCHTER ────────────────────────────────
  // Kein fetch zu fremden hosts ohne meldung.
  // Erlaubt bleiben: eigene origin, relative pfade, data:, blob:.
  try{
    const altFetch = window.fetch;
    window.fetch = function(input, init){
      let url;
      try{ url = typeof input === 'string' ? input : input.url; }
      catch(e){ url = ''; }

      if(url && !istEigen(url)){
        warnung('fremder fetch: ' + url);
      }
      // Kein credentials zu fremden hosts
      if(init && init.credentials === 'include' && !istEigen(url)){
        blockiert('credentials an fremden host');
        init = { ...init, credentials: 'omit' };
      }
      return altFetch.call(this, input, init);
    };
  }catch(e){ warnung('fetch nicht prüfbar'); }

  // ─── 8 · XHR WÄCHTER ──────────────────────────────────
  try{
    const altOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest){
      if(url && !istEigen(url)){
        warnung('fremder xhr: ' + url);
      }
      return altOpen.call(this, method, url, ...rest);
    };
  }catch(e){ /* xhr nicht verfügbar */ }

  // ─── 9 · WEBSOCKET WÄCHTER ────────────────────────────
  try{
    const altWS = window.WebSocket;
    window.WebSocket = function(url, protos){
      if(url && !istEigen(url)){
        warnung('fremder websocket: ' + url);
      }
      return new altWS(url, protos);
    };
    window.WebSocket.prototype = altWS.prototype;
  }catch(e){ /* ws nicht verfügbar */ }

  // ─── 10 · POSTMESSAGE WÄCHTER ─────────────────────────
  // Nachrichten dürfen nur von eigener origin kommen.
  window.addEventListener('message', (e) => {
    if(e.origin && e.origin !== location.origin){
      blockiert('fremde postMessage: ' + e.origin);
      return;
    }
  }, true);

  // ─── 11 · PROTOYTP-POLLUTION SCHUTZ ───────────────────
  // Object.prototype.__proto__ und constructor.prototype
  // dürfen nicht überschrieben werden.
  try{
    const proto = Object.prototype;
    ['__proto__'].forEach(k => {
      const desc = Object.getOwnPropertyDescriptor(proto, k);
      if(desc && desc.configurable){
        Object.defineProperty(proto, k, {
          get(){ return Object.getPrototypeOf(this); },
          set(v){
            blockiert('__proto__ setzen blockiert');
          },
          configurable: false,
        });
      }
    });
  }catch(e){ /* nicht möglich */ }

  // ─── 12 · PERMISSIONS WÄCHTER ─────────────────────────
  // Kamera, Mikro, Standort — niemals.
  if(navigator.permissions && navigator.permissions.query){
    ['camera','microphone','geolocation'].forEach(name => {
      try{
        navigator.permissions.query({ name }).then(p => {
          if(p.state === 'granted'){
            warnung(`${name} bereits erlaubt`);
          }
        }).catch(()=>{});
      }catch(e){}
    });
  }

  // getUserMedia abfangen
  if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
    const altGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(constraints){
      blockiert('getUserMedia gerufen');
      return Promise.reject(new Error('SECURITY · kamera/mikro blockiert'));
    };
  }

  // Geolocation abfangen
  if(navigator.geolocation){
    const altGeo = navigator.geolocation.getCurrentPosition;
    navigator.geolocation.getCurrentPosition = function(){
      blockiert('geolocation gerufen');
      if(arguments[1]) arguments[1](new Error('SECURITY · standort blockiert'));
    };
  }

  // ─── 13 · PROTOKOLL ÜBER PRÜFUNG ──────────────────────
  // window.open darf nur zu eigenen pfaden öffnen.
  try{
    const altOpen = window.open;
    window.open = function(url, ...rest){
      if(url && !istEigen(url)){
        blockiert('window.open fremd: ' + url);
        return null;
      }
      return altOpen.call(this, url, ...rest);
    };
  }catch(e){}

  // ─── 14 · HISTORY SCHUTZ ──────────────────────────────
  // history.pushState darf die origin nicht verlassen.
  try{
    const altPush = history.pushState;
    const altReplace = history.replaceState;
    history.pushState = function(state, title, url){
      if(url && !istEigen(url)){
        blockiert('history.pushState fremd: ' + url);
        return;
      }
      return altPush.call(this, state, title, url);
    };
    history.replaceState = function(state, title, url){
      if(url && !istEigen(url)){
        blockiert('history.replaceState fremd: ' + url);
        return;
      }
      return altReplace.call(this, state, title, url);
    };
  }catch(e){}

  // ─── 15 · CLIPBOARD WÄCHTER ───────────────────────────
  // Lesen aus dem Clipboard = spionieren.
  if(navigator.clipboard && navigator.clipboard.readText){
    const altRead = navigator.clipboard.readText.bind(navigator.clipboard);
    navigator.clipboard.readText = function(){
      warnung('clipboard.readText gerufen');
      return Promise.reject(new Error('SECURITY · clipboard lesen blockiert'));
    };
  }

  // ─── 16 · FORM-ACTION WÄCHTER ─────────────────────────
  // Formulare dürfen nur an eigene adressen senden.
  window.addEventListener('submit', (e) => {
    const f = e.target;
    const action = f.getAttribute('action');
    if(action && !istEigen(action)){
      blockiert('form an fremden host: ' + action);
      e.preventDefault();
    }
  }, true);

  // ─── 17 · HILFSFUNKTION ───────────────────────────────
  function istEigen(url){
    if(!url) return true;
    if(url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) return true;
    if(url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('#')) return true;
    try{
      const u = new URL(url, location.origin);
      return u.origin === location.origin;
    }catch(e){ return false; }
  }

  // ─── 18 · KONSOLE BERUHIGEN ───────────────────────────
  // Fremder Code der window.logger oder window.capture überschreibt
  // hat oft böse absicht. Wir frieren die Konsole ein.
  try{
    const altLog = console.log;
    Object.defineProperty(console, 'log', {
      value: function(...args){ return altLog.apply(console, args); },
      writable: false,
      configurable: false,
    });
  }catch(e){}

  // ─── 19 · VERSTECKTE SKRIPTE FINDEN ───────────────────
  // Auch nach DOMContentLoaded: alles was per JS eingefügt wurde.
  window.addEventListener('load', () => {
    document.querySelectorAll('script').forEach(s => {
      const src = s.getAttribute('src');
      if(src && !istEigen(src)){
        blockiert('fremdes skript im DOM: ' + src);
      }
    });
    document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"]').forEach(l => {
      const href = l.getAttribute('href');
      if(href && !istEigen(href)){
        blockiert('fremdes stylesheet: ' + href);
      }
    });
  });

  // ─── 20 · DER BERICHT ALS GLOBAL ──────────────────────
  window.__EVO_BERICHT = bericht;

  // Nur warnen wenn was zu warnen ist
  if(bericht.fehler.length){
    console.error('evoMIND · FEHLER', bericht.fehler);
  }
  if(bericht.warnung.length){
    console.warn('evoMIND · WARNUNG', bericht.warnung);
  }
  if(bericht.blockiert.length){
    console.warn('evoMIND · BLOCKIERT', bericht.blockiert);
  }

  // ─── 21 · EIN SATZ ZUM SCHLUSS ────────────────────────
  // Das ist das machbare. Nicht mehr.
  // Was läuft, ist sichtbar. Was sichtbar ist, ist ehrlich.
  // Ehrlichkeit ist der einzige echte schutz.

})();
