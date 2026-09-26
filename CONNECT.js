/* ═══════════════════════════════════════════════════════════
   CONNECT.js · evoMIND · kader · iki1uc
   ═══════════════════════════════════════════════════════════
   Verbindung als Verhandlung.

   Regel:
   was sichtbar ist, kann verhandelt werden.
   was verborgen ist, wird diktiert.

   Dieses modul tut nichts heimlich.
   Jede verbindung hat einen namen.
   Jede route hat eine bedingung.
   Jede bedingung steht im vertrag.
   ═══════════════════════════════════════════════════════════ */

export const CONNECT = {

  /* ─── DIE SCHICHTEN ────────────────────────────────────
     Vier wege. Jeder eine andere reichweite.
     lan    = nah        (kabel · raum · eigenes haus)
     wlan   = fern        (funk · ohne kabel)
     gate   = tor         (wo alles ein und aus geht)
     wloch  = durchgang   (die route zwischen zwei punkten)
     allxall = alles zu allem (der vollausbau · nur mit einigung)
  ─────────────────────────────────────────────────────── */
  lan:    true,
  wlan:   true,
  gate:   "WLAN-GATE",
  wloch:  "WLOCH-ROUTE",
  allxall:"ALLXALL-CONNECT",

  /* ─── DIE BEDINGUNGEN · DAS VERHANDELBARE ──────────────
     Jede schicht hat einen vertrag.
     Ohne vertrag ist die schicht stumm.
     So ist macht nie ungefragt.
  ─────────────────────────────────────────────────────── */
  vertrag: {
    lan:    { offen: true,  bedingung: null,               seit:null },
    wlan:   { offen: true,  bedingung: null,               seit:null },
    gate:   { offen: true,  bedingung: "kein fremder host",seit:null },
    wloch:  { offen: true,  bedingung: "nur eigene origin",seit:null },
    allxall:{ offen: false, bedingung: "nur mit einigung", seit:null },
  },

  /* ─── VERHANDELN ───────────────────────────────────────
     Eine schicht kann geöffnet, geschlossen oder
     mit einer bedingung versehen werden.
     Immer sichtbar. Immer protokolliert.
  ─────────────────────────────────────────────────────── */
  verhandle(schicht, aenderung){
    if(!this.vertrag[schicht]){
      return { ok:false, fehler:"unbekannte schicht: " + schicht };
    }
    const alt = { ...this.vertrag[schicht] };
    this.vertrag[schicht] = {
      ...alt,
      ...aenderung,
      seit: Date.now(),
    };
    return {
      ok: true,
      schicht,
      alt,
      neu: this.vertrag[schicht],
      zeit: new Date().toISOString(),
    };
  },

  /* ─── PRÜFEN · IST DIE SCHICHT OFFEN? ──────────────────
     Jede verbindung fragt zuerst hier.
     Öffnen ohne prüfen gibt es nicht.
  ─────────────────────────────────────────────────────── */
  prüfe(schicht, ziel){
    const v = this.vertrag[schicht];
    if(!v) return { ok:false, grund:"keine schicht" };
    if(!v.offen) return { ok:false, grund:"geschlossen" };

    // Bedingung prüfen
    if(v.bedingung === "kein fremder host"){
      if(ziel && !istEigen(ziel)){
        return { ok:false, grund:"bedingung verletzt: fremder host" };
      }
    }
    if(v.bedingung === "nur eigene origin"){
      if(ziel && !istEigen(ziel)){
        return { ok:false, grund:"bedingung verletzt: fremde origin" };
      }
    }
    if(v.bedingung === "nur mit einigung"){
      if(!this.einigung || !this.einigung[schicht]){
        return { ok:false, grund:"keine einigung" };
      }
    }
    return { ok:true, schicht, ziel: ziel||null };
  },

  /* ─── EINIGUNG ─────────────────────────────────────────
     allxall braucht einigung. Zwei seiten.
     Eine allein reicht nicht.
  ─────────────────────────────────────────────────────── */
  einigung: {},

  einigen(schicht, seiteA, seiteB){
    if(!seiteA || !seiteB){
      return { ok:false, grund:"zwei seiten nötig" };
    }
    if(seiteA === seiteB){
      return { ok:false, grund:"seiten müssen verschieden sein" };
    }
    this.einigung[schicht] = {
      a: seiteA,
      b: seiteB,
      zeit: Date.now(),
      protokoll: `einigung: ${schicht} zwischen ${seiteA} und ${seiteB}`,
    };
    return { ok:true, einigung: this.einigung[schicht] };
  },

  /* ─── RAUM SCANNEN ─────────────────────────────────────
     Was ist in diesem raum?
     Wer will rein? Wer darf rein?
  ─────────────────────────────────────────────────────── */
  scanRoom(room){
    const prüfLan    = this.prüfe('lan', room);
    const prüfWlan   = this.prüfe('wlan', room);
    const prüfGate   = this.prüfe('gate', room);
    const prüfWloch  = this.prüfe('wloch', room);

    return {
      room,
      via: this.wloch,
      mode: this.allxall,
      schichten: {
        lan:   prüfLan.ok,
        wlan:  prüfWlan.ok,
        gate:  prüfGate,
        wloch: prüfWloch,
      },
      // Rohe sicht: nichts versteckt
      roh: {
        lan:   this.vertrag.lan,
        wlan:  this.vertrag.wlan,
        gate:  this.vertrag.gate,
        wloch: this.vertrag.wloch,
      },
      status: prüfLan.ok && prüfWlan.ok ? "ROOM-SCAN-OK" : "ROOM-SCAN-GESPERRT",
      zeit: Date.now(),
    };
  },

  /* ─── PIPE MAPPEN ──────────────────────────────────────
     Welche leitung liegt zwischen zwei punkten?
     Welche bedingungen gelten?
     Was kostet sie?
  ─────────────────────────────────────────────────────── */
  mapPipe(pipe){
    const prüfGate  = this.prüfe('gate', pipe);
    const prüfWloch = this.prüfe('wloch', pipe);
    const prüfAll   = this.prüfe('allxall', pipe);

    return {
      pipe,
      link: this.lan && this.wlan ? "LAN/WLAN" : this.lan ? "LAN" : this.wlan ? "WLAN" : "KEINE",
      gate: this.gate,
      route: this.wloch,
      mode: this.allxall,
      // Was gilt
      bedingungen: {
        gate:  this.vertrag.gate.bedingung,
        wloch: this.vertrag.wloch.bedingung,
        allxall: this.vertrag.allxall.bedingung,
      },
      // Was offen ist
      offen: {
        gate:  prüfGate.ok,
        wloch: prüfWloch.ok,
        allxall: prüfAll.ok,
      },
      status: prüfGate.ok && prüfWloch.ok ? "PIPE-MAP-OK" : "PIPE-MAP-GESPERRT",
      zeit: Date.now(),
    };
  },

  /* ─── DAS VERHANDELBARE IM GANZEN ──────────────────────
     Ein blick. Was steht zur verhandlung.
     Wer nichts sieht, kann nichts fordern.
  ─────────────────────────────────────────────────────── */
  verhandlungsmasse(){
    return {
      schichten: Object.entries(this.vertrag).map(([name, v]) => ({
        name,
        offen: v.offen,
        bedingung: v.bedingung,
        seit: v.seit,
      })),
      einigungen: Object.entries(this.einigung).map(([name, e]) => ({
        schicht: name,
        a: e.a,
        b: e.b,
        zeit: e.zeit,
      })),
      zeit: Date.now(),
      urheber: 'iki1uc',
    };
  },

  /* ─── EIN SATZ ZUM SCHLUSS ─────────────────────────────
     Verbindung ist kein zugriff.
     Verbindung ist ein vertrag.
     Ohne vertrag: keine verbindung.
  ─────────────────────────────────────────────────────── */
  satz: "verbindung ist kein zugriff · verbindung ist ein vertrag",
};

/* ─── HILFSFUNKTION ──────────────────────────────────── */
function istEigen(url){
  if(!url) return true;
  if(url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) return true;
  if(url.startsWith('data:') || url.startsWith('blob:')) return true;
  try{
    const u = new URL(url, location.origin);
    return u.origin === location.origin;
  }catch(e){ return false; }
}
