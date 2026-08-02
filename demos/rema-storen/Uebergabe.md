# Übergabe — technischer Stand `auftragsfluss.html`

Ergänzung zu `Umsetzung_Checkliste.md` (dort: Punkt-Status). Hier nur, was nicht in der Checkliste steht.

## 1. Werkzeuge / Umgebung

- **Python:** `C:\Users\Harald\AppData\Local\Python\bin\python.exe` — `python3` in der Bash ist ein WindowsApps-Stub und schlägt fehl. Playwright 1.61 ist installiert.
- **Server** (aus dem Demo-Ordner, im Hintergrund):
  `python.exe -m http.server 8090 --bind 127.0.0.1`
- **Testen immer in der Elternseite:** `http://localhost:8090/REMA_Storen_Demo_v3.html`, nie `auftragsfluss.html` allein.
- **Sicherungen:** `auftragsfluss.html.bak_vor_feedback`, `REMA_Storen_Demo_v3.html.bak_vor_feedback`

## 2. Bundle entpacken / zurückpacken — Pflichtprozedur

`auftragsfluss.html` ist ein selbstentpackender «Bundled Page»-Export. Der gesamte Inhalt liegt **JSON-kodiert in einer einzigen Zeile** (~79'000 Zeichen) in `<script type="__bundler/template">` (Zeile 384). Direkt in der Datei editieren ist nicht praktikabel; das Edit-Tool kann sie wegen der Grösse auch nicht lesen.

```bash
PY="C:\Users\Harald\AppData\Local\Python\bin\python.exe"

# entpacken -> normal lesbares HTML (~880 Zeilen)
"$PY" _bundle_unpack.py extract auftragsfluss.html arbeit.html

# ... arbeit.html mit Read/Edit bearbeiten ...

# zurückpacken (schreibt auftragsfluss.html in-place)
"$PY" _bundle_unpack.py inject auftragsfluss.html arbeit.html
```

- Die Arbeitsdatei liegt **nicht** im Repo — nach jedem Chat-Wechsel neu `extract`en. `auftragsfluss.html` enthält immer den aktuellen Stand.
- `inject` escaped `</` zu `<\u002F` (wie der Original-Bundler) und prüft per assert, dass kein `</script>` im Payload landet.
- **Kein Byte-Vergleich mit dem Original:** die Escaping-Variante unterscheidet sich um wenige Zeichen. Korrektheitskriterium ist der **dekodierte** String — der ist identisch. Nicht hinterherjagen.
- Manifest, Schriften und `page_order` werden nicht angefasst.

## 3. Aufbau der entpackten Datei

| Bereich | Inhalt |
|---|---|
| Zeilen 1–~377 | `@font-face`-Block und CSS. Finger weg. |
| ~378–~674 | **statisches Markup — hier steht aller Inhaltstext** |
| ab ~675 | `<script type="text/x-dc">`: Komponente, berechnet nur Styles/Höhen |

**Wichtig:** Im Komponenten-Script steht **kein Inhaltstext** (verifiziert). Jede Textänderung ist genau eine Stelle im Markup — nicht doppelt pflegen.

Muster pro Schritt (N = 1..9):
```
<button data-row="N">  … Titel · graue Zelle «Wie es oft läuft» · dunkle Pille «So läuft es bei Ihnen»
<div id="detN"> → <div id="dinN"> → slotN + boxN
    boxN:  Label «So machen wir das» · <p> Aufklapp-Text · <div> Tag-Chips
```
Tag-Chips sind `<span>` mit `border-radius:999px;background:#ffcb08`. Neue Chips **immer durch Kopieren eines bestehenden** anlegen, nur Text tauschen. Keine neuen CSS-Klassen, das iframe hat eigenes CSS.

## 4. Zahnrad-Tabelle `AREAS` — Stand nach Teil H

Im `text/x-dc`-Script, direkt am Anfang (`const AREAS = {`), mit Kommentarblock darueber.

**Schluessel — seit Teil H neu belegt, unbedingt lesen:**

| Schluessel | Bereich | Position | Groesse |
|---|---|---|---|
| `a2` | **Sie und Ihr Team** (Nabe) | Mitte (150,150) | 115 |
| `a1` | IT & Daten | oben links | 76 |
| `a4` | Website | oben rechts | 76 |
| `a3` | **Handwerker-Software** (vorher KI) | unten rechts | 76 |
| `abuch` | bexio | unten links | 76 |

```js
1:['a4'], 2:['a1','a3'], 3:['a3','abuch'], 4:['a3','abuch'], 5:['a3'],
6:['a3'], 7:['a3','a1'], 8:['a3','abuch'], 9:['a4','a3','a1']
```

**Zwei harte Regeln:**

1. `a2` ist **statisch** und darf in **keinem** Schritt in `AREAS` stehen. Die Nabe leuchtet nie auf und nie ab; sie beantwortet nicht die Frage «welcher Bereich traegt diesen Schritt», sondern sagt, dass entschieden wird im Betrieb. Ein `a2` in `AREAS` bricht die Aussage der Grafik.
2. `a3` heisst **Handwerker-Software**, nicht KI. Wer aeltere Notizen liest, findet `a2`=Software und `a3`=KI — das ist der Stand **vor** Teil H. Ein `KI:`-Praefix darf im Ablauf nicht mehr vorkommen.

Die Ripple-Ringe stehen jetzt bei ihren eigenen Zahnraedern (`a3`/`a4` waren vertauscht), der Ring der Mitte ist entfernt, und `'a2'` ist aus der Lab-/Ring-Schleife in `renderVals()` heraus.

Dieselbe Karte steckt in `zahnrad-animation.html` (`areas()` und `center.lines`) und ist mitgezogen. `Werkzeugwand.html` zeigt **nicht** diese Karte, sondern unser Leistungsportfolio — seit Review 6.1 drei Bereiche (Handwerker-Software, IT, Website) plus die Zange als Querschnitt; «KI & Automatisierung» ist als eigener Bereich aufgeloest, die KI steckt in allen dreien.

## 5. Höhen-Sender — fertig, nicht anfassen

- Sitzt **am Ende von `auftragsfluss.html`, ausserhalb des Bundles** (nach dem letzten `</script>` des Bootstraps), als reines `<script>` — dort direkt editierbar.
- Misst das **Maximum über die Unterkanten aller Kinder** (`getBoundingClientRect().bottom`), nicht `body.scrollHeight` — das unterschätzt, weil das Zahnrad absolut positioniert ist und aus der Body-Box ragt.
- **Klemmt jede Unterkante an clippende Vorfahren** (`visibleBottom()`). Ohne das zählen die *zugeklappten* Aufklapp-Inhalte mit, weil `getBoundingClientRect()` deren Layout-Position auch dann liefert, wenn `overflow:hidden` mit `height:0` sie abschneidet — das erzeugte über 600 px toten Leerraum unter dem Ablauf, der mit der Textlänge mitwuchs.
- Geklemmt wird **nur, wo wirklich abgeschnitten wird** (`p.scrollHeight > p.clientHeight + 1`). Ein Wrapper mit `overflow-x:hidden` bekommt rechnerisch auch eine clippende Y-Achse, seine Höhe folgt aber dem Inhalt — dagegen zu klemmen wäre zirkulär und pinnte die Höhe fest (Symptom: alles gleichmässig ~600 px zu kurz).
- `_test_hoehe.py` nutzt **dieselbe** Messlogik und gibt zusätzlich die naive Messung aus; die Differenz zeigt, wie viel zugeklappter Inhalt sonst mitgezählt würde. Bei Änderungen an einer der beiden Stellen die andere mitziehen.
- Meldet `postMessage {type:'auftragsfluss-resize', height}`; Listener liegt in der Elternseite (Zeile 506–513) und war schon vorhanden.
- Trigger: `DOMContentLoaded`, `load`, `resize`, `ResizeObserver`, Nachmessen alle 60 ms bis 1.4 s nach jedem Klick, plus 400-ms-Sicherheitsintervall.
- Der `ResizeObserver` hängt sich neu an, weil der Bootstrap das `document` ersetzt (`seenBody`-Vergleich). Der IIFE selbst überlebt, weil er an `window` hängt.
- Elternseite bleibt unverändert; `.flow-iframe{height:1500px}` ist nur noch Fallback, `scrolling="no"` bleibt.
- Nach jeder Textänderung prüfen: `"$PY" _test_hoehe.py` — Überhang muss ≤ 0 bleiben.

**Die Werkzeugwand hat einen eigenen, einfacheren Sender** (`werkzeugwand-resize`, `document.body.scrollHeight`, in der Komponente selbst). Die Elternseite folgt ihm **auf jeder Breite** — bis 01.08. nur unter 640 px, darüber galt ein festes Seitenverhältnis. Das `aspect-ratio` im CSS ist seither nur noch Startwert, bis die erste Meldung eintrifft.

**Die Falle dabei:** Eine Seite, die ihre Höhe selbst meldet, darf sich nicht nach der Fensterhöhe bemessen — sonst jagen sich Rahmen und Inhalt. Genau das passierte: die Bildsäule war `width: min(1600px, 128vh)`, der Rahmen wuchs, damit `vh`, damit das Bild, damit der Inhalt. Auf dem Handy lief es bis 1'474 px hoch und zeigte statt der Wand einen Ausschnitt einer einzelnen Wasserwaage. Die Breite steht jetzt als `saeuleW` in `renderVals()` und haengt am selben Desktop/Handy-Schalter wie der Rest: `min(1160px, 76vw)` bzw. `1080px`. **In allen drei iframes gilt: keine `vh`-Einheit, kein `100vh`.**

Der **absolute Deckel von 1160 px** ist kein Schoenheitswert: ohne ihn waechst die Wand mit der Fensterbreite mit und ragt auf einem breiten, flachen Schirm unten aus dem Bild. Ausgereizt ist er auch — bei `80vw/1240px` passt der Abschnitt weder auf 1440×900 noch auf 1920×950 unter die Kopfzeile. Wer daran dreht, misst nach: Abschnittshoehe + 85 px Kopfzeile muss unter die Fensterhoehe passen.

## 6. Tag-Regeln (harte Regeln, maschinell prüfbar)

| Präfix | Bedeutung | Pflichtformel |
|---|---|---|
| `Software:` / `bexio:` | Standardfunktion (Kat. A) | — |
| `IT:` | Fremdprodukt (Kat. B) | muss **«richten wir ein»** enthalten |
| `KI:` | Eigenbau (Kat. C) | muss **«bauen wir»** enthalten |
| Kat. D | kann niemand / bieten wir nicht an | **kein Tag, kein Zahnrad, kein Satz** im Ablauf |
| Kat. E | unsicher | als «prüfen wir im Setup» formulieren |

**Ein gelber Kasten pro Bereich (seit 31.07.2026, harte Regel):** je Schritt darf **genau ein** Tag pro leuchtendem Zahnrad stehen — nie zweimal `Software:` in einem Schritt. Mehrere Aussagen werden zusammengepackt und kurz gehalten, im Zweifel bleibt nur das Wichtigste. Damit gilt: Anzahl Kästen = Anzahl leuchtender Zahnräder, jedes Präfix höchstens einmal. Der Prüfer in `Umsetzung_Checkliste.md`, Teil I, rechnet das gegen `AREAS`.

**Textlänge (seit 31.07.2026, harte Regel):** jeder «So machen wir das»-Absatz hat **maximal 3–4 Sätze** und muss den Handwerker überzeugen, nicht die Architektur erklären. Wer Inhalt ergänzt, muss anderen streichen — was rausfiel, steht in `Umsetzung_Checkliste.md`, Teil I.

Verboten: `KI:` + «richten wir ein», `IT:` + «bauen wir». Kein Tag darf dem Aufklapp-Text widersprechen. Keine Preise. Max. 6 Wörter pro Tag (`&` und `—` nicht mitzählen — der Prüfer unten zählt sie mit und meldet dadurch 7).

Prüfer (auf der entpackten Arbeitsdatei):
```bash
"$PY" -c "
import io,re
r=io.open('arbeit.html',encoding='utf-8').read()
for t in re.findall(r'border-radius:999px[^>]*>([^<]{3,70})</span>', r):
    t=t.replace('&amp;','&').strip(); bad=''
    if t.startswith('KI:') and 'bauen wir' not in t: bad='KI ohne bauen wir'
    if t.startswith('IT:') and 'richten wir ein' not in t: bad='IT ohne richten wir ein'
    print('%-50s %s' % (t, bad))
"
```

## 7. Noch offene Regelverstösse in den Tags (Schritte 4–9)

Aktueller Prüfer-Output, alles noch zu bearbeiten:

- `Software: übernimmt Masse & Mengen aus bexio` — Rollen vertauscht (Punkt 22/23)
- `bexio: hat eigenes Bestellwesen & Lager` — Satz soll ganz weg (22)
- `Software: Liefertermin direkt am Auftrag sichtbar` — manuell erfasst (32)
- `Software: plant Route automatisch` — unbelegt, streichen (33)
- `Software: erfasst Zeit & Belege für die Rechnung` (8 Wörter, zu lang)
- `KI: liest Sprachmemo und Fotos aus` — **KI ohne «bauen wir»** (43)
- `IT: Belege automatisch archiviert` — **IT ohne «richten wir ein»** (38)
- `Website: Kunde bucht Termin selbst` — eTermin, Kat. B (48)
- `Software: Wartungsintervalle laufen automatisch mit` — falsch, → `KI: Wartungserinnerung bauen wir` (47)
- «Meisterwerk» — 1 Treffer, in Schritt 4 (Punkt 4/24)

## 8. Querlaufende Punkte — am Ende nochmals anfassen

Diese lassen sich erst schliessen, wenn alle neun Schritte durch sind:

| Nr. | Warum offen/teilweise | Abschlussprüfung |
|---|---|---|
| **1** | Tag-↔-Text-Widersprüche: Schritt 1+2 bereinigt, Schritt 9 offen | jeden der 9 Aufklapp-Texte gegen seine Tags lesen |
| **2** | Fünf-Kategorien-Logik nur in Schritt 1–3 durchgezogen | Prüfer aus Abschnitt 6 muss 0 Verstösse melden; Kat. B und E müssen irgendwo vorkommen, Kat. D nirgends |
| **4** | Meisterwerk-Rest in Schritt 4 | Volltextsuche «Meisterwerk» = 0 über alle Dateien |
| 16 | Referenzmuster erst auf Schritt 1+2 übertragen | Schritte 8 und 9 nachziehen |
| 55 | harte Diktat-Grenze nur in Schritt 3 gesetzt | Erwähnung in Schritt 6 (Rapport) und 7 (Bautagebuch) ergänzen |
| 61 | Konflikt mit 31/60, siehe Abschnitt 4 | Schritt 5 braucht den `KI:`-Tag zum leuchtenden Zahnrad |

## 8b. Elternseite — seit dem BW-Feedback nicht mehr unveraendert

`REMA_Storen_Demo_v3.html` ist **kein Bundle**, direkt editierbar. Neu darin (Teil I):

- **Annahmen-Kasten** (`.annahmen`) direkt über dem Ablauf-iframe: benennt die vier Stellen, an denen der
  Ablauf raet. Wer den Ablauf inhaltlich aendert, muss diesen Kasten mitlesen — er behauptet, was der
  Ablauf annimmt.
- **Betriebs-Karte mit Kommentarspalte** (`.betrieb-note`, Grid jetzt dreispaltig). Links Fakten von
  remastoren.ch, rechts unsere Konsequenz. Dort steht bewusst **keine** Team- oder Personenzahl.
- Datum **August 2026** an vier Stellen — wird die Demo spaeter verschickt, alle vier mitziehen.
- Die Vorschau-Leiste und der Footer tragen die Herkunftsangabe. Nicht entfernen, das war eine
  ausdrueckliche Forderung aus dem Feedback.

## 9. Bereits abgeschlossen — nicht neu aufrollen

- **Konsistenz ausserhalb des Auftragsflusses: nichts zu ändern.** Sichtbarer Text von `Werkzeugwand.html`, `zahnrad-animation.html` und der Elternseite enthält keine KI-Telefonie, kein Meisterwerk, keine Preise, keine Chatbot-Tag-Sprache.
- Die `CHF`-Treffer in `Werkzeugwand.html` sind **Fehlalarme in base64-Asset-Daten**, kein sichtbarer Text. Immer auf dem entpackten Template prüfen, nicht auf der Rohdatei.
- `betriebs-section.html` wird nirgends eingebunden — verwaiste Datei, ignorieren.
- Kein Build-Skript für den Ablauf; `_build_gears.py` betrifft nur die SVG-Zahnräder der anderen Section.

## 9b. Zwei Fassungen — v3 und v4

Seit dem 01.08.2026 gibt es die Demo zweimal. **Beide nutzen dieselben drei iframes** (`auftragsfluss.html`, `zahnrad-animation.html`, `Werkzeugwand.html`) — Inhalt wird also nur einmal gepflegt. Unterschiedlich ist nur die Elternseite.

| | `REMA_Storen_Demo_v3.html` | `REMA_Storen_Demo_v4.html` |
|---|---|---|
| Zweck | Arbeits- und Gesprächsfassung, vollständig | **die Fassung, die verschickt wird** |
| Reihenfolge | Hero · Betriebs-Karte · Zeit/Zahnrad · Ablauf · Leistungen · Team · Einwände · CTA | Hero · Betriebs-Karte · **vier Entlastungen** · Zeit/Zahnrad · Ablauf · Leistungen · Team · Einwände · CTA |
| Botschaft steht ab | ~3300 px (im Ablauf verteilt) | **1294 px** — zweiter Bildschirm |
| Sorglos-Kacheln | vier | zwei (zwei sind in den Karten aufgegangen) |
| Annahmen-Kasten | vier Annahmen einzeln | zwei Sätze |
| GU-Erklärung | vier Sätze | zwei Sätze |

**Der Gedanke dahinter:** der Ablauf ist nicht zu detailliert, er stand nur an der falschen Stelle. In v4 kommt zuerst die Antwort («was fällt für mich weg») in vier Karten, danach das Bild, danach der Ablauf als Beleg. Wer nach den Karten aufhört, hat die Botschaft; wer weiterliest, bekommt den Beweis.

**Die vier Karten sind dieselben vier wie im Zahnrad** — Handwerker-Software, IT/Geräte/Telefon, Website, Treuhand (extern). Drei Ebenen, dieselbe Aussage: Bild → was es für Sie heisst → an einem Auftrag gezeigt.

Jede Karte hat denselben Bau: Bereich als Chip · Titel als Entlastung · zwei Sätze · **«Was bleibt:»** mit einer ehrlichen Grenze. Die Grenzen sind dieselben, die im Ablauf stehen — nur in seiner Sprache.

**Der Ablauf ist in den beiden Fassungen verschieden — das ist der Kern des Unterschieds.**

- **v3** bindet `auftragsfluss.html` ein: zehn Stationen zum Aufklappen, Zahnrad, gelbe Kästen. Diese Datei ist die Quelle der Wahrheit für alles Inhaltliche und wird **nicht** für v4 verändert.
- **v4** hat **keinen** Ablauf-iframe, sondern fünf Zeilen direkt in der Elternseite (`.kurz` / `.kzeile`): Schritt · wie es heute läuft · Pfeil · wie es bei ihm läuft. Kein Aufklappen, kein Zahnrad, keine Kästen — in zwanzig Sekunden gelesen. Der Ablauf-Abschnitt schrumpft dadurch von 2698 px auf 827 px.
- Die fünf Zeilen sind eine **Verdichtung** der zehn Stationen, keine zweite Wahrheit: Anfrage · Offerte · Baustelle · Rechnung · Jahre danach. Wer die zehn ändert, sollte prüfen, ob eine der fünf Zeilen mitmuss.
- Die Annahme steht als **eine Zeile** darunter, nicht mehr als Kasten: «unsere Annahme, gelesen von Ihrer Website. Stimmt etwas nicht, sagen Sie es uns.»

**Verworfen:** ein Kompaktmodus über `auftragsfluss.html?kompakt=1`, der nur die Überschrift ausblendet. Er machte den Ablauf nicht einfacher, nur kürzer betitelt — und hätte eine gemeinsam genutzte Datei mit Sonderlogik belastet.

**Beim Ändern beachten:** Textänderungen in den iframes wirken in beiden Fassungen. Änderungen an der Elternseite müssen bewusst in v3, v4 oder beiden gemacht werden. `_pruef.py` prüft die Doktrin-Begriffe in beiden, die Browser-Prüfungen laufen gegen v3.

## 9c. Schriften liegen lokal

Seit dem 02.08.2026 holt die Demo **nichts mehr von aussen**. Vorher hingen beide Fassungen an `fonts.googleapis.com` und `fonts.gstatic.com` — ohne Internet fiel das Layout auf Systemschrift zurück, und jeder Aufruf meldete die IP des Betrachters an Google.

- Quelle: `https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800`
- Übernommen wurden nur die **lateinischen Schnitte** (`latin` und `latin-ext`), 16 von 39 `@font-face`-Blöcken: `assets/fonts/fraunces-1.woff2`, `fraunces-2.woff2`, `manrope-3.woff2`, `manrope-4.woff2` — zusammen **163 KB**.
- Der `@font-face`-Block steht als `<style>` im Kopf beider Elternseiten, mit relativen Pfaden (`assets/fonts/…`). Beide Familien stehen unter der SIL Open Font License, Selbsthosting ist ausdrücklich erlaubt.
- Die drei iframes bringen ihre Schriften ohnehin als eigene Subsets im Bundle mit.
- **Der Pfeil → (U+2192) ist in keinem der Subsets** und fällt weiterhin auf die Systemschrift zurück — das war schon vorher so.

Zum Nachziehen (andere Schnitte, andere Familie): CSS mit einem modernen Browser-User-Agent abrufen, die Blöcke mit `unicode-range: U+0000-00FF` und `U+0100-02BA` behalten, die `woff2` herunterladen, `url(...)` auf `assets/fonts/…` umschreiben.

## 9d. Das Werkzeugwand-Foto

Der Werkzeugkasten wog **3.49 MB** — davon 3'442 KB ein einziges PNG im Bundle-Manifest. Als JPEG (Qualität 82, progressiv) sind es **244 KB**; die Datei liegt jetzt bei **0.45 MB**. Der Alphakanal war durchgehend 255, es ging also nichts verloren.

Im Manifest steht der Typ mit dabei (`"mime":"image/jpeg"`), er muss beim Austausch **mitgeändert** werden — der Bundler baut die Data-URL daraus. Sicherung: `werkzeugkasten.html.bak_vor_bild`.

**Am 02.08.2026 durch eine neue Fassung des Auftraggebers ersetzt: `Werkzeugwand.html`.** Dieselbe Rechnung noch einmal — 2'535 KB PNG im Manifest, als JPEG (Qualitaet 82) 260 KB, Datei von 3.43 MB auf 0.47 MB. Der alte `werkzeugkasten.html` liegt unter `_archiv/backups/werkzeugkasten.html.abgeloest_02.08`, die unbearbeitete neue Fassung als `Werkzeugwand.html.original`.

## 10. Prüflauf vor Abgabe

**Zuerst immer:**

```bash
"$PY" -m http.server 8090 --bind 127.0.0.1 &   # falls nicht schon laeuft
"$PY" _pruef.py                                 # alle Invarianten in einem Lauf
"$PY" _pruef.py --text                          # nur Text, ohne Browser
```

`_pruef.py` gibt 1 zurueck, wenn etwas bricht. Es prueft: `a2` nirgends in `AREAS` · je Schritt genau ein gelber Kasten pro leuchtendem Zahnrad · kein `KI:`-Praefix · `IT:` mit «richten wir ein» · `Website:` mit «bauen wir» · max. 6 Woerter · keine Preise · 2–3 Saetze je Aufklapp-Text · ein Kategorie-E-Satz · fuenf verbotene Begriffe · Bundle im Takt mit `arbeit.html` · Datum an allen Stellen gleich · Anker-Links aus iframes mit `target="_parent"` · keine 404 und keine Konsolenfehler · nichts unter 12 px · keine toten Anker · Einwand-Chips mit Panel und genau eines offen · Hero-Chip klappt das Team auf · Symmetrie im Vergleichsbild (mit 6.5 s Wartezeit fuer die Einflug-Animation) · nichts ragt bei 390 px heraus · iframe-Hoehe.

**Gegengeprueft:** dieselbe Logik auf `auftragsfluss.html.bak_vor_H` angewendet findet dort 22 Verstoesse — der Pruefer schlaegt also wirklich an und ist kein Gruenlicht-Automat.

### Von Hand, weil ein Skript es nicht sieht



```bash
"$PY" _test_hoehe.py                    # Überhang ≤ 0 über alle 9 Aufklapp-Elemente
"$PY" _shot_flow.py shot.png 8          # Screenshot mit Schritt 8 offen (2. Arg = Schritt)
```
Volltextsuche über die **entpackten** Templates: `Telefonie`, `Meisterwerk`, `CHF`, `falls möglich` → je 0 Treffer.
