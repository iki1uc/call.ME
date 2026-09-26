# SECURITY · evoMIND

## 1. Meldeweg
Sicherheitslücken NUR an: <deine-mail-oder-signal>
Nicht als Issue. Nicht als PR. Nicht öffentlich.

## 2. Kein Vertrauen ins Frontend
Alles was im Browser läuft, ist sichtbar.
Es gibt keine Client-Geheimnisse. Kein API-Key. Kein Token.

## 3. Engine-Regel
evoMIND ist Engine, kein OUR-Slot.
Engine-Code darf NICHT von außen geladen werden.
Keine externen Skripte. Keine externen Styles. Keine CDN.

## 4. Was gemeldet werden soll
- Code, der in einem anderen Kontext laufen kann (XSS)
- Dateien, die DOM außerhalb der Bühne manipulieren
- Module, die localStorage/sessionStorage ohne Prefix schreiben
- Ressourcen, die von fremden Servern geladen werden
