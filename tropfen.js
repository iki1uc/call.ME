import { CONNECT } from './CONNECT.js';

CONNECT.verhandlungsmasse();
// → zeigt alle schichten, bedingungen, einigungen

CONNECT.prüfe('allxall');
// → { ok:false, grund:'keine einigung' } solange keine einigung steht

CONNECT.einigen('allxall', 'spitze', 'master');
// → { ok:true, einigung:{...} }

CONNECT.prüfe('allxall');
// → { ok:true }
