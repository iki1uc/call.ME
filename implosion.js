/* ═══════════════════════════════════════════════════════════
   implosion.js · evoMIND · kader · iki1uc
   ═══════════════════════════════════════════════════════════
   Ebene 0. Der Boden.
   Ohne berechtigten schlüssel: daten werden nach karenz
   unzugänglich. Mit schlüssel: nachhandeln erlaubt.

   Wahrheit:
   Was im browser läuft, ist schon beim nutzer.
   Wir können es nicht "löschen".
   Wir können es unlesbar machen · unsichtbar machen ·
   unzugänglich machen innerhalb dieser seite.

   Das ist keine täuschung. Das ist die grenze.
   Wer sie kennt, kann damit arbeiten.
   ═══════════════════════════════════════════════════════════ */

const KARENZ_MS = 8 * 60 * 60 * 1000;   // 8 stunden
const PREFIX    = 'evo.implosion.';

export const IMPLOSION = {

  /* ─── DIE KARENZ ───────────────────────────────────────
     Ab anmeldung läuft die zeit.
     8 stunden. dann: entweder schlüssel oder implosion.
  ─────────────────────────────────────────────────────── */
  karenz: KARENZ_MS,

  /* ─── DER SCHLÜSSEL ────────────────────────────────────
     Kein passwort. Ein zeichen.
     Wer den schlüssel hat, darf nachhandeln.
     Wer ihn nicht hat, verliert den zugriff auf die daten
     dieser seite — sofort nach der karenz.
  ─────────────────────────────────────────────────────── */
  schluessel: null,

  /* ─── DIE KENNTNISNAHME ────────────────────────────────
     Jeder vorfall, jedes ereignis wird protokolliert.
     Kenntnisnahme ist pflicht. Nicht optional.
     Ohne kenntnisnahme: keine handlung.
  ─────────────────────────────────────────────────────── */
  vorkommnisse: [],

  /* ─── ANMELDUNG · startet die karenz ──────────────────
     Einmal rufen. Zeitstempel wird gesetzt.
     Danach läuft der countdown.
  ─────────────────────────────────────────────────────── */
  anmelden(){
    const jetzt = Date.now();
    const vorhanden = this._lese('anmeldung');
    if(vorhanden){
      return {
        ok: true,
        bereits: true,
        seit: vorhanden.seit,
        rest: Math.max(0, (vorhanden.seit + this.karenz) - jetzt),
      };
    }
    const eintrag = { seit: jetzt, karenz: this.karenz };
    this._schreibe('anmeldung', eintrag);
    this._vorkommnis('anmeldung', 'karenz gestartet', { seit: jetzt });
    return {
      ok: true,
      seit: jetzt,
      rest: this.karenz,
      karenz_ende: jetzt + this.karenz,
    };
  },

  /* ─── STATUS · läuft die karenz? ist sie abgelaufen? ── */
  status(){
    const jetzt = Date.now();
    const an = this._lese('anmeldung');
    if(!an){
      return { ok: false, grund: 'nicht angemeldet', phase: 'unangemeldet' };
    }
    const rest = (an.seit + this.karenz) - jetzt;
    const schluesselDa = !!this.schluessel;
    return {
      ok: true,
      seit: an.seit,
      rest: Math.max(0, rest),
      abgelaufen: rest <= 0,
      schluessel: schluesselDa,
      phase: rest > 0
        ? 'karenz'
        : schluesselDa
          ? 'nachhandeln-bereit'
          : 'implosion',
    };
  },

  /* ─── SCHLÜSSEL SETZEN ─────────────────────────────────
     Der schlüssel ist kein geheimnis.
     Er ist ein zeichen, dass jemand handeln darf.
     Wer ihn setzt, nimmt die verantwortung an.
  ─────────────────────────────────────────────────────── */
  setzeSchluessel(zeichen, urheber){
    if(!zeichen || typeof zeichen !== 'string' || zeichen.length < 4){
      return { ok: false, grund: 'zeichen zu kurz' };
    }
    this.schluessel = zeichen;
    this._schreibe('schluessel', {
      vorhanden: true,
      laenge: zeichen.length,
      urheber: urheber || 'unbekannt',
      seit: Date.now(),
      // das zeichen selbst wird NICHT gespeichert
    });
    this._vorkommnis('schluessel', 'gesetzt', { urheber });
    return { ok: true, seit: Date.now() };
  },

  /* ─── PRÜFEN · darf diese session handeln? ──────────── */
  darfHandeln(versuchterSchluessel){
    const jetzt = Date.now();
    const an = this._lese('anmeldung');
    if(!an){
      return { ok: false, grund: 'nicht angemeldet' };
    }
    const abgelaufen = (an.seit + this.karenz) <= jetzt;
    if(!abgelaufen){
      // innerhalb der karenz — alles erlaubt
      return { ok: true, phase: 'karenz', rest: (an.seit + this.karenz) - jetzt };
    }
    // karenz vorbei — schlüssel nötig
    if(!this.schluessel){
      return { ok: false, grund: 'implosion · kein schlüssel gesetzt' };
    }
    if(versuchterSchluessel !== this.schluessel){
      return { ok: false, grund: 'implosion · schlüssel stimmt nicht' };
    }
    return { ok: true, phase: 'nachhandeln' };
  },

  /* ─── IMPLOSION · der vorgang ──────────────────────────
     Wenn die karenz abgelaufen ist und kein schlüssel da ist:
     alle zugangsdaten dieser seite werden unlesbar.
     Nicht gelöscht. Unlesbar.
     Das ist ehrlich: der browser hat sie, wir nehmen sie ihm.
  ─────────────────────────────────────────────────────── */
  fuehreAus(){
    const jetzt = Date.now();
    const an = this._lese('anmeldung');
    if(!an){
      return { ok: false, grund: 'nicht angemeldet' };
    }
    if((an.seit + this.karenz) > jetzt){
      return { ok: false, grund: 'karenz läuft noch',
               rest: (an.seit + this.karenz) - jetzt };
    }
    if(this.schluessel){
      return { ok: false, grund: 'schlüssel vorhanden · keine implosion nötig' };
    }

    // Alle evo.* daten dieser seite unzugänglich machen
    const betroffen = [];
    try{
      for(let i = 0; i < localStorage.length; i++){
        const k = localStorage.key(i);
        if(k && k.startsWith('evo.') && !k.startsWith('evo.implosion.')){
          betroffen.push(k);
        }
      }
      betroffen.forEach(k => {
        // erst markieren, dann leeren
        localStorage.setItem(k, '__implodiert__');
      });
    }catch(e){}

    this._vorkommnis('implosion', 'ausgeführt', {
      betroffen: betroffen.length,
      schluessel: false,
    });

    return {
      ok: true,
      phase: 'implosion',
      betroffen: betroffen.length,
      zeit: jetzt,
      // Was bleibt: die vorkommnisse selbst.
      // Sie sind das gedächtnis der implosion.
    };
  },

  /* ─── KENNTNISNAHME · pflicht ──────────────────────────
     Ohne kenntnisnahme kein nachhandeln.
     Wer einen vorfall nicht gelesen hat, darf nicht tun.
  ─────────────────────────────────────────────────────── */
  nimm_kenntnis(id){
    const v = this.vorkommnisse.find(x => x.id === id);
    if(!v){
      return { ok: false, grund: 'vorkommnis nicht gefunden' };
    }
    v.kenntnisnahme = Date.now();
    this._schreibe_vorkommnisse();
    return { ok: true, vorkommnis: v };
  },

  /* ─── VORFALL · ERREIGNIS · die liste ──────────────────
     Alles, was passiert, wird protokolliert.
     Art · Zeit · Wer · Was.
  ─────────────────────────────────────────────────────── */
  liste(typ){
    if(!typ) return this.vorkommnisse.slice();
    return this.vorkommnisse.filter(v => v.typ === typ);
  },

  /* ─── DIE WÄHRUNG · halbes leben ───────────────────────
     Kein geld. Keine punkte.
     Ein maß, das nur von dem kommt, der es stiftet.
     Es ist die menge an gelebtem leben, die jemand
     einsetzt, damit etwas wirklich wird.
  ─────────────────────────────────────────────────────── */
  stiftung: {
    waehrung: 'halbes leben',
    urheber: 'iki1uc',
    seit: null,
    // Wenn jemand sein halbes leben stiftet, wird es hier eingetragen.
    // Nicht als betrag. Als tatsache.
    eintraege: [],
  },

  stifte(wer, was){
    if(!wer || !was){
      return { ok: false, grund: 'wer und was nötig' };
    }
    const eintrag = {
      wer,
      was,
      waehrung: 'halbes leben',
      zeit: Date.now(),
      // Keine bewertung. Keine anrechnung.
      // Nur: es ist gestiftet.
    };
    this.stiftung.eintraege.push(eintrag);
    if(!this.stiftung.seit) this.stiftung.seit = eintrag.zeit;
    this._schreibe('stiftung', this.stiftung);
    this._vorkommnis('stiftung', 'halbes leben gestiftet', eintrag);
    return { ok: true, eintrag };
  },

  stiftungen(){
    return {
      waehrung: this.stiftung.waehrung,
      urheber: this.stiftung.urheber,
      seit: this.stiftung.seit,
      anzahl: this.stiftung.eintraege.length,
      eintraege: this.stiftung.eintraege.slice(),
    };
  },

  /* ─── INTERN ─────────────────────────────────────────── */
  _schreibe(k, v){
    try{ localStorage.setItem(PREFIX + k, JSON.stringify(v)); }catch(e){}
  },
  _lese(k){
    try{
      const r = localStorage.getItem(PREFIX + k);
      return r ? JSON.parse(r) : null;
    }catch(e){ return null; }
  },
  _schreibe_vorkommnisse(){
    try{
      localStorage.setItem(PREFIX + 'vorkommnisse',
        JSON.stringify(this.vorkommnisse));
    }catch(e){}
  },
  _vorkommnis(typ, was, daten){
    const v = {
      id: 'v-' + Date.now() + '-' + Math.random().toString(36).slice(2,8),
      typ, was,
      daten: daten || {},
      zeit: Date.now(),
      kenntnisnahme: null,
    };
    this.vorkommnisse.push(v);
    if(this.vorkommnisse.length > 500) this.vorkommnisse.shift();
    this._schreibe_vorkommnisse();
    return v;
  },

  /* ─── INIT ─────────────────────────────────────────────
     Wird beim laden gerufen.
     Stellt den letzten stand wieder her.
  ─────────────────────────────────────────────────────── */
  init(){
    const v = this._lese('vorkommnisse');
    if(Array.isArray(v)) this.vorkommnisse = v;
    const s = this._lese('stiftung');
    if(s && typeof s === 'object') this.stiftung = { ...this.stiftung, ...s };
    return this.status();
  },

  /* ─── EIN SATZ ZUM SCHLUSS ──────────────────────────── */
  satz: 'ohne schlüssel keine handlung · ohne kenntnisnahme kein recht · währung ist halbes leben',
};

/* ─── AUTO-INIT ────────────────────────────────────────── */
try{
  if(typeof window !== 'undefined'){
    window.addEventListener('DOMContentLoaded', () => {
      IMPLOSION.init();
    });
  }
}catch(e){}
