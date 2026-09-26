export const CONNECT = {
  lan: true,
  wlan: true,
  gate: "WLAN-GATE",
  wloch: "WLOCH-ROUTE",
  allxall: "ALLXALL-CONNECT",

  scanRoom(room) {
    return {
      room,
      via: this.wloch,
      mode: this.allxall,
      status: "ROOM-SCAN-OK"
    };
  },

  mapPipe(pipe) {
    return {
      pipe,
      link: "LAN/WLAN",
      gate: this.gate,
      route: this.wloch,
      mode: this.allxall,
      status: "PIPE-MAP-OK"
    };
  }
};
