// EFFECT.js — Effekte / Reaktionen / Output

export const EFFECT = {
  pulse(msg) {
    return {
      msg,
      effect: "PULSE",
      stamp: Date.now()
    };
  },

  flash(msg) {
    return {
      msg,
      effect: "FLASH",
      stamp: Date.now()
    };
  }
};
