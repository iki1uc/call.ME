/* atom.js · die vier stoffe · iki1uc */

export const ATOM = {

  o2:   0.60,
  co2:  0.60,
  h2o:  0.60,
  kern: 0.60,

  atemDauer: 8000,
  mitte: 0.60,
  band:  0.15,

  atme(t){
    const phase = (t % this.atemDauer) / this.atemDauer;
    const einatmen = phase < 0.5
      ? Math.sin(phase * Math.PI)
      : -Math.sin((phase - 0.5) * Math.PI);
    const delta = einatmen * 0.004;

    this.o2  = Math.max(0, Math.min(1, this.o2  + delta));
    this.co2 = Math.max(0, Math.min(1, this.co2 - delta));
    this.h2o = Math.max(0, Math.min(1, this.h2o + delta * 0.15));
    this.kern = 0.5 + Math.sin(t * 0.0004) * 0.25;

    return this.zustand();
  },

  zustand(){
    return {
      o2:   this.o2,
      co2:  this.co2,
      h2o:  this.h2o,
      kern: this.kern,
      atem: this.o2 - this.co2,
      frieden: this.istFrieden(),
      waage: this.waage(),
    };
  },

  istFrieden(){
    const nah = (x) => Math.abs(x - this.mitte) < this.band;
    return nah(this.o2) && nah(this.co2)
        && nah(this.h2o) && nah(this.kern);
  },

  waage(){
    const d = (x) => Math.abs(x - this.mitte);
    return { o2: d(this.o2), co2: d(this.co2), h2o: d(this.h2o), kern: d(this.kern) };
  },

  satz: 'o2 und co2 sind gegenpole · atem bewegt sie · frieden ist das band',
};
