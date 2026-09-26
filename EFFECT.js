/* ═══════════════════════════════════════════════════════════
   EFFECT.js · evoMIND · kader · iki1uc
   ═══════════════════════════════════════════════════════════
   Der tropfen fällt.
   Was dann passiert, ist keine explosion.
   Es ist eine implosion — sammlung nach innen.

   Regel:
   wirkung ist keine gewalt.
   wirkung ist eine deutung.

   Alles ist tmp.
   Kein effekt hält. Jeder effekt zeigt.

   Noah und der teufel.
   El burro und el diablo.
   Nicht gegner. zwei seiten derselben münze.
   Beide nicht erreichbar auf normalen wegen.
   Deshalb brauchen sie einen rahmen — tmp.
   ═══════════════════════════════════════════════════════════ */

export const EFFECT = {

  /* ─── DIE SCHICHTEN DES FALLENS ────────────────────────
     Ein tropfen fällt in stufen.
     Jede stufe ist ein effekt.
     Jede stufe ist tmp.
     Keine stufe hält.
     Aber jede stufe lässt etwas zurück.
  ─────────────────────────────────────────────────────── */

  /* 1 · PULSE
     Der tropfen berührt die oberfläche.
     Kein laut. Nur bewegung. */
  pulse(msg, tiefe = 0.5){
    return {
      msg,
      effect: "PULSE",
      schicht: "berührung",
      tiefe,
      stamp: Date.now(),
      tmp: true,
    };
  },

  /* 2 · FLASH
     Der tropfen wird kurz sichtbar.
     Nicht heller als nötig. Nur so hell wie wahr. */
  flash(msg, dauer = 400){
    return {
      msg,
      effect: "FLASH",
      schicht: "sichtbar werden",
      dauer,
      stamp: Date.now(),
      tmp: true,
    };
  },

  /* 3 · WIRBEL
     Was um den tropfen liegt, wird gedreht.
     Nicht weggerissen. Nur in bewegung gebracht.
     So sieht man: es gibt mehr als einen punkt. */
  wirbel(msg, richtung = 1, staerke = 0.5){
    return {
      msg,
      effect: "WIRBEL",
      schicht: "umlauf",
      richtung,     // +1 = rechts · -1 = links
      staerke,
      stamp: Date.now(),
      tmp: true,
    };
  },

  /* 4 · BLITZ
     Der tropfen wird zur linie.
     Nicht um zu treffen. Um zu erinnern.
     Ein blitz ist ein gedächtnis, das kurz sichtbar wird. */
  blitz(msg, von = null, nach = null){
    return {
      msg,
      effect: "BLITZ",
      schicht: "linie",
      von, nach,
      stamp: Date.now(),
      tmp: true,
    };
  },

  /* 5 · IMPLOSION
     Nicht nach außen.
     Nach innen.
     Alles, was im raum war, wird gesammelt.
     Das ist keine zerstörung. Das ist ordnung. */
  implosion(msg, radius = 1.0){
    return {
      msg,
      effect: "IMPLOSION",
      schicht: "sammlung",
      richtung: "innen",
      radius,          // wie weit der raum reicht, der gesammelt wird
      stamp: Date.now(),
      tmp: true,
      // Keine sprengkraft. Nur anzug.
    };
  },

  /* ─── DIE DEUTUNG ──────────────────────────────────────
     Wirkung ohne deutung ist zufall.
     Wirkung mit deutung ist wahl.
     Jeder effekt kann gedeutet werden.
  ─────────────────────────────────────────────────────── */
  deute(effect, deutung){
    if(!effect || typeof effect !== 'object') return null;
    return {
      ...effect,
      deutung,
      // Deutung ändert den effekt nicht.
      // Aber sie ändert, was er für den bedeutet, der ihn sieht.
      gedeutet: true,
      deutungszeit: Date.now(),
    };
  },

  /* ─── DIE KETTE · DROP FÄLLT DURCH ALLE SCHICHTEN ────
     Ein tropfen, der wirklich fällt,
     geht durch alle schichten.
     Nicht nacheinander. Gleichzeitig.
     Aber man sieht sie nacheinander.
  ─────────────────────────────────────────────────────── */
  fällt(msg){
    const t0 = Date.now();
    const stufen = [
      this.pulse(msg, 0.2),
      this.flash(msg, 300),
      this.wirbel(msg, +1, 0.4),
      this.blitz(msg, 'oben', 'mitte'),
      this.implosion(msg, 1.0),
    ];
    return {
      msg,
      stufen,
      dauer: Date.now() - t0,
      anfang: t0,
      ende: Date.now(),
      tmp: true,
      // Der tropfen fällt. Was bleibt, ist die spur.
    };
  },

  /* ─── NOAH UND TEUFEL · DIE ZWEI SEITEN ───────────────
     El burro und el diablo.
     Nicht gegner. Nicht freunde.
     Zwei seiten derselben tatsache.
     Beide nicht erreichbar auf normalen wegen.
     Deshalb: tmp — ein rahmen, in dem sie sichtbar werden,
     ohne zu bleiben.
  ─────────────────────────────────────────────────────── */
  zweiSeiten(seiteA, seiteB, tmpRahmen){
    if(!tmpRahmen){
      return { ok:false, grund:"ohne tmp-rahmen unsichtbar" };
    }
    if(!seiteA || !seiteB){
      return { ok:false, grund:"beide seiten nötig" };
    }
    if(seiteA === seiteB){
      return { ok:false, grund:"eine seite ist keine zweiheit" };
    }
    return {
      ok: true,
      a: { name: seiteA, rolle: "erste seite" },
      b: { name: seiteB, rolle: "zweite seite" },
      rahmen: tmpRahmen,
      // Der rahmen ist der einzige ort, an dem beide sichtbar sind.
      // Außerhalb des rahmens: unsichtbar.
      sichtbar: true,
      bleibt: false,
      zeit: Date.now(),
      // Die eine tatsache, die sie teilen:
      gemeinsam: "beide nicht auf normalen wegen erreichbar",
    };
  },

  /* ─── WIRKLICHKEITSDEUTUNG ────────────────────────────
     Nicht: was ist passiert.
     Sondern: was bedeutet es, dass es passiert ist.
     Deutung ist keine meinung. Deutung ist eine wahl.
  ─────────────────────────────────────────────────────── */
  wirklichkeit(gesehen, gedeutet){
    if(!gesehen){
      return { ok:false, grund:"nichts gesehen" };
    }
    return {
      gesehen,
      gedeutet: gedeutet || null,
      // Zwei wirklichkeiten aus einer sache:
      //   die, die war
      //   die, die man aus ihr macht
      wirklichkeit_war: gesehen,
      wirklichkeit_wird: gedeutet || gesehen,
      wahl: gedeutet ? "gedeutet" : "unge deutet",
      zeit: Date.now(),
    };
  },

  /* ─── EIN SATZ ZUM SCHLUSS ─────────────────────────────
     Wirkung ist kein knall.
     Wirkung ist ein rahmen,
     in dem zwei seiten sichtbar werden,
     ohne sich zu berühren.
  ─────────────────────────────────────────────────────── */
  satz: "wirkung ist keine gewalt · wirkung ist ein rahmen · zwei seiten · eine tatsache",
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
