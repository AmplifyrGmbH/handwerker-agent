# Umsetzung Auftragsfluss-Feedback — Arbeitsprotokoll (abgeschlossen)

**Grundlage:** `Auftragsfluss_Feedback_GESAMT.md` (61 Punkte)
**Zieldatei:** `auftragsfluss.html` (Quelle der Wahrheit, per iframe in `REMA_Storen_Demo_v3.html`)
**Sicherungen:** `auftragsfluss.html.bak_vor_feedback`, `REMA_Storen_Demo_v3.html.bak_vor_feedback`
**Technik:** siehe `Uebergabe.md`

**Ergebnis: 60 erledigt · 1 teilweise · 0 nicht umsetzbar**

## Nachbesserungsrunde (6 Änderungen)

1. **Offert-Architektur festgelegt** statt offengelassen: Offerte und Rechnung entstehen in der Handwerker-Software, bexio ist Buchhaltung und empfängt fertige Belege. Eiserne Regel im Text: genau eine Rechnungs-Engine, bexio stellt selbst keine Rechnung aus; Zahlungseingang und Mahnwesen bleiben in bexio. Alternative nur noch als ein Satz (Treuhänder-Fall).
2. **Schritt 8 angepasst:** Rechnung entsteht in der Handwerker-Software, bexio bekommt sie als fertigen Beleg. Tag `Software an bexio: Rechnung aus Rapport` → `Software: Rechnung aus dem Rapport`, bexio-Tag → `bexio: verbucht, MWST, Banking & Lohn`.
3. **`AREAS[5]` → `['a2']`**, KI-Tag und der Eigenbau-Satz in Schritt 5 entfernt. Punkt 61 gewinnt; die Liefertermin-Erinnerung ist eine Aufgabe mit Fälligkeitsdatum, also Kategorie A.
4. **`AREAS[9]` → `['a4','a3','a2']`** plus Tag `Software: Objekthistorie am Auftrag`. Punkt 50 damit vollständig.
5. **Terminbuchung einheitlich `IT:`** in Schritt 2 und 9 (eTermin = Kategorie B). Der `Website:`-Tag ist entfallen.
6. **Schritt 4 entflochten:** Erstbestellung der Storen aus der Offerte durch das Büro; die Bedarfsmeldung des Monteurs ist nach Schritt 6 gewandert (Nachschub während der Montage), samt Tag.

## Sachkorrekturen aus der noovi-Seite «Ein-/Ausgangsrechnungen»

**A — Lieferantenrechnungen sind Kategorie A, nicht Eigenbau.** noovi scannt sie, liest sie per KI selbst aus und ordnet sie dem Projekt zu. Betroffen war der Tag in Schritt 8 `KI: Foto & Diktat auslesen — bauen wir`: «Foto auslesen» war so breit formuliert, dass er das Beleg-Scanning mitabdeckte und damit eine Standardfunktion als Eigenbau verkaufte.
- Schritt 8: Tag → `KI: Rapport auslesen — bauen wir`, Text auf «Foto vom **handgeschriebenen Rapport-Zettel**» und «daraus Menge und Positionen zu machen» eingeschränkt.
- Schritt 4: Standardfunktion dort eingesetzt, wo die Lieferantenrechnung vorkommt — «Die Lieferantenrechnung wird eingescannt — die Handwerker-Software liest sie selbst aus und ordnet sie dem Auftrag zu; verbucht wird sie als Kreditor in bexio», plus Tag `Software: Lieferantenrechnung wird ausgelesen`.
- Merkposten für die Kategorie-Logik: noovis *eigene* KI ist Kategorie A (`Software:`), nicht C. Der Tag beantwortet, welcher Bereich es trägt — nicht, ob Technik dahinter KI heisst.

**B — Debitorenübersicht und Mahnwesen liegen in der Handwerker-Software.** noovi hat ein vollständiges Mahnwesen (vier Stufen, Mahngebühren, Verzugszinsen, Mahnungs-PDF per Mail, Mahnverlauf) und Debitorenstatus offen/teilbezahlt/bezahlt/überfällig. Zwei Korrekturschritte waren nötig:

- **Schritt 8** neu: «Welche Rechnungen offen, teilbezahlt, bezahlt oder überfällig sind, sehen Sie in der Handwerker-Software — und gemahnt wird dort ebenfalls: vier Stufen, Mahngebühren, gesetzlicher Verzugszins, Mahnungs-PDF per Mail, Mahnverlauf am Auftrag. **Gemahnt wird immer dort, wo die Rechnung entsteht** — sonst mahnt ein System Rechnungen, die es nie ausgestellt hat. Was sie nicht kann: Zahlungseingänge markiert Ihr Büro von Hand als bezahlt; den automatischen Abgleich über die Bankdatei gibt es nur in bexio. Dort bleiben Buchhaltung, MWST, Kreditoren, Lohn und Banking.»
- **Schritt 3 hatte denselben Fehler** («Zahlungseingang und Mahnwesen bleiben dort», gemeint bexio) und wurde mitkorrigiert: «Offene Posten und Mahnwesen laufen dort, wo die Rechnung entsteht — also ebenfalls in der Handwerker-Software; bexio bleibt für Buchhaltung, MWST, Kreditoren, Lohn und Banking.»
- Tags: `Software: offene & überfällige Rechnungen` → `Software: Debitoren & Mahnwesen`; `bexio: Bankabgleich, MWST, Lohn & Mahnwesen` → `bexio: Buchhaltung, MWST, Lohn & Bankabgleich`.

## Korrektur am Höhen-Sender (selbst gefunden)

Die erste Fassung nahm das Maximum über **alle** Kinder. Damit zählten die **zugeklappten** Aufklapp-Inhalte mit, weil `getBoundingClientRect()` deren Layout-Position auch dann liefert, wenn `overflow:hidden` mit `height:0` sie abschneidet — Folge: über 600 px toter Leerraum unter dem Ablauf, der mit jeder Textverlängerung mitwuchs. Der Sender klemmt Unterkanten jetzt an clippende Vorfahren, aber **nur wo wirklich abgeschnitten wird** (`scrollHeight > clientHeight`); ein Wrapper mit `overflow-x:hidden` hat rechnerisch auch eine clippende Y-Achse, seine Höhe folgt aber dem Inhalt — dagegen zu klemmen wäre zirkulär. `_test_hoehe.py` nutzt jetzt dieselbe Logik und zeigt die naive Messung als Vergleichsspalte.

Geschlossen 1540 px (vorher fälschlich 2148) · Schritt 3 offen 2273 · Schritt 8 offen 2429 · Überhang 0 px, optisch geprüft.

Nachgeprüft: die verbleibenden «bauen wir»-Behauptungen sind nur noch Chatbot, Anfrage→Auftrag, Aufmass-Diktat, Rapport-Auslesen und Wartungserinnerung — keine überlappt mit einer noovi-Standardfunktion.

⚠️ **Offen aus Änderung 5:** Schritt 9 trägt jetzt einen `IT:`-Tag, aber `AREAS[9]` enthält kein `'a1'` — der IT-Bereich leuchtet dort nicht. Das ist der einzige verbleibende Tag-↔-Zahnrad-Bruch. Fix wäre `AREAS[9]` um `'a1'` zu erweitern (dann leuchten in Schritt 9 vier Bereiche).

## Prüflauf-Ergebnis

| Prüfung | Ergebnis |
|---|---|
| Volltext `Telefonie`, `Meisterwerk`, `CHF`, `falls möglich` über alle Dateien | **0 Treffer** (auch `GPS`, `Route`, `Schweizerdeutsch` = 0) |
| Tag-Regeln: 28 Tags geprüft | **0 Verstösse** — alle 5 `KI:`-Tags enthalten «bauen wir», alle 3 `IT:`-Tags «richten wir ein» |
| Tag-Länge max. 6 Wörter | **0 Überschreitungen** |
| Zahnräder gegen Soll-Ist-Tabelle | stimmen überein |
| iframe-Höhe über alle 9 Aufklapp-Elemente | folgt dem Inhalt, grösster Überhang **0 px** |
| Glyphen ausserhalb der Font-Subsets | keine (`→` entfernt, fiel auf Systemschrift zurück) |
| HTML/Interaktion | alle 9 Aufklapp-Elemente und die Zahnrad-Animation funktionieren |

Höhenverlauf: zu 1877 px · Schritt 3 offen 2455 · Schritt 4 offen 2469 · Schritt 8 offen 2356 · Schritt 9 offen 1930.

## Der verbleibende `teilweise`-Punkt

**24 — «noovi-Auftragsnummer».** Umgesetzt als «die Auftragsnummer der Handwerker-Software». Grund: Punkt 52 verlangt, die Anonymität der Handwerker-Software konsequent durchzuhalten; «noovi» hier zu nennen hätte sie als einzige Stelle im ganzen Ablauf gebrochen und wäre mit dem Rest der Demo (Werkzeugkasten, iframe-Titel) kollidiert. Der Meisterwerk-Bezug ist entfernt, die Referenz-Mechanik unverändert. Umkehrbar durch Ersetzen dieser einen Formulierung.

Die Punkte **50** und **61** sind in der Nachbesserungsrunde auf *erledigt* gewechselt (Objekthistorie mit Tag und Zahnrad; Schritt 5 auf `['a2']` zurückgebaut).

## Nebenbefund: Interpretation der Kategorie-D-Regel

Die harte Regel sagt, Kategorie D dürfe «gar nicht im Ablauf erscheinen – kein Zahnrad, kein Tag, kein Satz». Die Punkte 26, 30, 59 und 60 verlangen aber ausdrücklich den ehrlichen D-Satz («das leistet keine Software»). Aufgelöst so: D wird **nie als Leistung** dargestellt (kein Tag, kein Zahnrad), aber **als benannte Grenze** im Text beibehalten — genau das, was Punkt 30 «den ehrlichsten Absatz der Seite» nennt. Das «kein Satz» der harten Regel bezieht sich auf verkaufte Nicht-Leistungen wie die KI-Telefonie, die vollständig entfernt ist.

---

## Teil G – Korrekturen aus der noovi-Wissensdatenbank

Quelle: doku.noovi.ch. Diese Runde überholt mehrere Punkte des Feedback-Dokuments — noovi kann deutlich mehr, als dort angenommen wurde. Grundlinie: **was Standardfunktion ist, wird nicht als Eigenbau verkauft.**

| Nr. | Status | Was geändert wurde |
|---|---|---|
| G1 | erledigt | Anfragenverwaltung als Kategorie A dargestellt. Schritt 1: Lead-Scoring-Satz + Tag `Software: Anfragen werden bewertet`. Schritt 2: Tafel mit Status «Neu → Offerte erstellt → Nachfassen → Gewonnen», Bewertung, Quelle, Überfälligkeits-Erinnerung, Umwandlung in ein Projekt; Führungsnutzen ergänzt («wie viele Anfragen offen sind, was sie zusammen wert sind und wie viele Sie gewinnen»). Tags neu: `Software: Anfrage mit Status & Nachfass-Termin`, `Software: Pipeline & Gewinnquote`. Eigenbau eingeengt: `KI: Anfrage wird Auftrag — bauen wir` → **`KI: Anfrage landet automatisch — bauen wir`**, im Text auf die Übergabe aus Chatbot/Mail/WhatsApp begrenzt. Schritt 3: Nachfassen als eigener Status mit Erinnerung, Tag `Software: Nachfassen mit Erinnerung` |
| G2 | erledigt | Kunden-Chat aufgenommen, Punkt 53/54 korrigiert. Schritt 6: zwei getrennte Kanäle benannt, Berechtigung und Push beschrieben; Tags `Software: Baustellen-Chat fürs Team` + `Software: Kunden-Chat am Auftrag`. Schritt 2: WhatsApp verliert die Alleinstellung — «Wie der Kunde schreibt, entscheidet er; in beiden Fällen hängt die Nachricht am Auftrag statt in einem privaten Verlauf» |
| G3 | erledigt | Rechnungswesen und Debitoren ausgebaut. Schritt 8: Rechnung mit Schweizer QR-Code, eigenem Layout und Nummernkreis; Abschläge nach Leistungsstand und Schlussrechnung; Liste offen/teilbezahlt/überfällig mit Verzugstagen; vierstufiges Mahnwesen mit Mahngebühren und Verzugszins, jede Mahnung wird freigegeben. Prinzip fett: «gemahnt wird immer dort, wo die Rechnung entsteht». Einzige echte Lücke ehrlich benannt: automatischer Zahlungsabgleich über Bankdatei und QR-Referenz nur in bexio, sonst Handmarkierung. Tags: `Software: Abschläge & Schlussrechnung`, `Software: offene Posten & überfällig`, `Software: Mahnwesen in vier Stufen`. Schritt 9: Abo-Rechnung für Wartungsverträge + Tag `Software: Wartung als Abo-Rechnung`. Eingangsrechnungen sind bereits als Kategorie A getaggt (Schritt 4, `Software: Lieferantenrechnung wird ausgelesen`) |
| G4 | erledigt | `IT: Archivierung richten wir ein` → **`IT: M365-Ablage richten wir ein`**; im Text klargestellt: «Die Dokumente synchronisiert die Software selbst nach SharePoint — wir verbinden sie mit Ihrem M365.» Also Standard-Schnittstelle (A), unsere Leistung ist das Verbinden (B) |
| G5 | **nur geprüft, nichts geändert** | Alle fünf `KI: … bauen wir`-Tags gegen noovis Automatisierungs-Engine und OpenAI-Schnittstelle geprüft. Liste mit Einschätzung liegt beim Auftraggeber zur Entscheidung |
| G6 | erledigt | Leistungsverzeichnis mit SIA-Import und Ampelsystem in Schritt 3 (+ Tag). Rüstliste in Schritt 6 (+ Tag `Software: Rüstliste pro Projekt`). GPS/Quartix: keine Änderung nötig — Fahrzeugortung wird im Ablauf nirgends erwähnt, «GPS» hat 0 Treffer; die Streichung aus Punkt 33 betraf nur den Zeitstempel und bleibt richtig |
| G7 | erledigt | Weiche geschlossen: ein empfohlener Weg. Offerte und Rechnung entstehen in der Handwerker-Software; bexio-Rolle ausdrücklich benannt (Buchhaltung, MWST, Lohn, Banking mit automatischem Zahlungsabgleich, Kreditoren mit Zahlläufen, Jahresabschluss). Alternative als ein Satz: «Wenn der Treuhänder es strikt anders will, entstehen Offerte und Rechnung in bexio — dann tippt Ihr Büro die Positionen einmal ab.» Eiserne Regel bleibt. Schlussabsatz nachgezogen: «Anfrage, Offerte, Rapport und Rechnung immer in der Handwerker-Software» |

### Zahnrad-Änderung aus G1

`AREAS[1]` → `['a4','a3','a2']`. Grund: Schritt 1 trägt mit dem Lead-Scoring erstmals einen `Software:`-Tag; ohne leuchtendes Software-Zahnrad hätte der Tag seinem Zahnrad widersprochen. Das weicht von der ursprünglichen Soll-Ist-Tabelle ab (dort `Web + KI`) — die Tabelle entstand vor diesen Funden. Rückweg: Tag und Satz aus Schritt 1 entfernen, dann `['a4','a3']`.

## Teil G2 – Feinschliff nach Teil G

> Umbenannt: dieser Abschnitt hiess früher «Teil H». Der Auftrag vom 30.07.2026 legt einen neuen, inhaltlich anderen **Teil H** an (siehe unten); die Punkte hier heissen deshalb G2-1 bis G2-5, damit «H1» eindeutig bleibt.

| Nr. | Änderung |
|---|---|
| G2-1 | **Lead-Scoring von Schritt 1 nach Schritt 2 verschoben.** In Schritt 1 existiert noch keine Anfrage im System, also kann sie auch nicht bewertet werden — die Chronologie war falsch. Satz und Tag sitzen jetzt in Schritt 2 (`Software: Anfrage mit Status & Bewertung`), `AREAS[1]` ist zurück auf `['a4','a3']` und stimmt wieder mit der Soll-Ist-Tabelle überein |
| G2-2 | **Produktkatalog-Widerspruch aufgelöst.** Die Offerte entsteht in der Handwerker-Software, der Katalog wird aber in bexio gepflegt. Neu im Text: «gepflegt in bexio, von dort synchronisiert — was die Schnittstelle überträgt, klären wir im Setup». Tag `bexio: Produktkatalog & Preise` → `bexio: Produktkatalog wird synchronisiert`. Der Schlussabsatz nennt den Artikelstamm jetzt ausdrücklich. **Offen für den Democall:** welche Felder die Schnittstelle genau überträgt und in welche Richtung |
| G2-3 | **Zwei überladene Absätze entlastet.** Die Architektur-Erklärung ist aus Schritt 3 herausgelöst und steht als eigener kurzer Absatz am Schluss (bestehendes `<p>`-Muster geklont, keine neue CSS-Klasse). Der SharePoint-Satz ist aus der Geldgeschichte in Schritt 8 nach Schritt 7 gewandert, wo die Aufbewahrung steht — samt Tag `IT: M365-Ablage richten wir ein`; `AREAS[7]` → `['a2','a1']`, `AREAS[8]` → `['a2','abuch','a3']` |
| G2-4 | **Schritt 9 entwidersprüchlicht.** Neu explizit: «Das ist zweierlei: die Rechnung kommt automatisch, an den Serviceeinsatz erinnert die Software nicht — die Erinnerung dazu bauen wir.» |
| G2-5 | **Texte kompakter, weniger gelbe Chips.** Alle neun Aufklapp-Texte gestrafft, Chips von **41 auf 24** reduziert (max. 4 pro Schritt, Schritt 1 und 5 nur einer). Jeder leuchtende Bereich hat weiter mindestens einen Tag, kein Tag ohne Zahnrad |

### Entscheid zu G5 (vom Auftraggeber)

Nichts umtaggen, bevor der Democall gelaufen ist — die aktuellen Tags sind der ehrliche schlechtere Fall: wir versprechen mehr Eigenleistung als nötig, der umgekehrte Fehler wäre teuer.

Korrektur an meiner Ableitung: Auch wenn noovi Anfragen per API empfangen kann, baut und betreibt die Übergabe trotzdem jemand — Parsing, Feldmapping, Dublettenerkennung, Fehlerbehandlung. «Bauen wir» ist deshalb nicht automatisch falsch; die Frage ist nur, ob es als **Entwicklung** oder als **Einrichtung** verkauft wird. Erwartung nach dem Democall:

- `KI: Anfrage landet automatisch — bauen wir` → wahrscheinlich `IT: … richten wir ein`
- `KI: Wartungserinnerung bauen wir` → wahrscheinlich `IT: … richten wir ein`
- `KI: Diktat wird Position — bauen wir` und `KI: Rapport auslesen — bauen wir` → **bleiben Eigenbau**, weil eine Textschnittstelle Vorschläge erzeugt, aber nichts strukturiert in Felder zurückschreibt — genau das ist unser Teil
- `Web + KI: Chatbot bauen wir` → unangefochten

### Prüfung nach Teil G

**24 Tags** (nach Teil G2), 0 Regelverstösse, keiner über 6 Wörter, keine Preise. Höhe folgt über alle 9 Aufklapp-Elemente, Überhang 0 px (geschlossen 1704 px, Schritt 8 offen 2332 px). Volltext über alle Dateien: `Telefonie`, `Meisterwerk`, `CHF`, `falls möglich`, `GPS` = 0 Treffer. Optisch geprüft, Layout intakt.

Zahnräder aktuell: `1:['a4','a3'] 2:['a1','a3','a2'] 3:['a2','a3','abuch'] 4:['a2','abuch'] 5:['a2'] 6:['a2'] 7:['a2','a1'] 8:['a2','abuch','a3'] 9:['a4','a3','a2']` — **von Teil H überholt, siehe unten.**

---

## Teil H – Neues Zahnrad-Bild: das Team in die Mitte, KI kein eigener Bereich

**Sicherungen dieser Runde:** `auftragsfluss.html.bak_vor_H`, `zahnrad-animation.html.bak_vor_H`, `werkzeugkasten.html.bak_vor_H`, `REMA_Storen_Demo_v3.html.bak_vor_H`, `Umsetzung_Checkliste.md.bak_vor_H`

| Nr. | Status | Was geändert wurde |
|---|---|---|
| H1 | erledigt | **Getauscht statt gelöscht, keine neue Geometrie.** Die Handwerker-Software übernimmt den bestehenden `a3`-Pfad unten rechts (Satellitengrösse 76), der grosse `a2`-Pfad in der Mitte wird die Nabe. Mitte ist **statisch**: nie in `AREAS`, kein Auf-/Ableuchten, immer sichtbar, keine Figur und kein Icon — nur das Label. Legende: vier Bereiche (Website, IT, Software, bexio), «KI» ist als Bereich weg; die Mitte erscheint nur als Bildbeschriftung. `aria-label` des SVG nachgezogen. Zwei Nebenfunde mitkorrigiert, siehe unten |
| H2 | erledigt | Diktat→Position (S3) und Rapport-Auslesen (S8) als Eigenbau entfernt, **die Grenzen bleiben im Text**: S3 «Diktieren liefert Text im Notizfeld, keine gefüllten Felder — die Positionen erfasst Ihr Büro aus dem Aufmass»; S8 «Dass daraus Mengen und Positionen entstehen, leistet keine Software — kontrolliert und freigegeben wird von einem Menschen». Wartungserinnerung (S9): Tag entfernt, Grenze benannt — Begründung aus der Doku-Prüfung siehe unten |
| H3 | erledigt | Service-Einstieg in Schritt 1 neu: Adresse, Storentyp, **Foto vom Typenschild**, Dringlichkeit → landet als Service-Anfrage in der Handwerker-Software. Nutzen im Text: das Typenschild-Foto spart die Besichtigungsfahrt, die heute nur das Modell bestimmt — bei sieben Lieferantenmarken ein realer Zeitgewinn (Markenzahl auf der Elternseite belegt: Griesser · Somfy · MHZ · Rufalex · Weinor · Bernina · CM). Tag `Website: Service-Formular bauen wir` |
| H4 | erledigt | Chatbot geschärft: beantwortet, nennt einen Preisrahmen, erfasst **im Gespräch** Storentyp, Anzahl, Stockwerk, privat/Verwaltung, Foto, Wunschzeitraum und legt daraus die Anfrage an. Dieselben Felder als schlichtes Formular daneben — «zwei Türen, ein Datenweg». Kein Preisrechner |
| H5 | erledigt | Kanalregeln statt WhatsApp-Erzählung. S2: Privatkunde → WhatsApp Business, Verwaltung → E-Mail mit Referenz (Wert = die Mail landet am Auftrag), Kunden-Chat der App nur als «eine Möglichkeit, kein Regelweg»; Halbsatz zu sichtbaren Zuständigkeiten auf der Website. S6: alles mit Auftragsbezug in den Projekt-Chat, Begründung Garantiefall/Reklamation, und als eigener Satz: **Monteure haben keinen direkten Kundenkontakt per WhatsApp** |
| H6 | erledigt | S2 Telefonie ausgebaut: Warteschleife auf beide Bürokräfte, Überlauf auf Voicemail-zu-Mail nach definierter Zeit, Zeitsteuerung mit Ansage, individuelle Geschäftsnummern, ausgehende Anrufe der Monteure zeigen die Geschäftsnummer. S7 Ablage neu getrennt: Rechnungsaufbewahrung deckt die Software ab (finalisierte Rechnung unveränderbar, nur Stornorechnung, Server in der Schweiz), alles andere in eine definierte Ablage mit Versionierung und Aufbewahrungsregel — **nichts existiert nur in einem Postfach oder auf einem Laptop**. Tag `IT: M365-Ablage richten wir ein` → `IT: Ablage & Aufbewahrung richten wir ein`, `AREAS[7]` trägt `'a1'` |
| H7 | erledigt | Rückkopplung S8 → S3: verkaufte Stunden (extern verrechenbar / nicht verrechenbar / intern; acht kalkuliert, sechs verkauft = in jeder Rechnung zu billig), Pauschalen bei Neumontagen (Preis fix, Marge allein an der Stundenschätzung), und der Satz, der den Kreis schliesst — «was Sie bei der Montage gemessen haben, bestimmt, was Sie beim nächsten Mal offerieren». Tag `Software: Nachkalkulation pro Baustelle` wieder gesetzt |
| H8 | erledigt | S9: Wartungsvertrag online auf der Website abschliessen, Termin selbst buchen — aus Einmalkunden wiederkehrender Umsatz. Trennung bleibt explizit: die **Rechnung** wiederkehrt automatisch, der **Serviceeinsatz** wird nicht erinnert. Tag `Website: Wartungsabo abschliessen — bauen wir` |

### Neue Tag-Sprache — vollständig durchgezogen

| Präfix | Bedeutung | Pflichtformel |
|---|---|---|
| `Software:` / `bexio:` | Standardfunktion des jeweiligen Systems | — |
| `IT:` | wir setzen auf, verbinden, konfigurieren | «richten wir ein» |
| `Website:` | wir entwickeln selbst (Website, Formulare, Chatbot) | «bauen wir» |
| `KI:` | **existiert nicht mehr** | — |

Die fünf alten `KI:`-Tags: `Web + KI: Chatbot bauen wir` → `Website: Chatbot bauen wir` · `KI: Anfrage landet automatisch — bauen wir` → `IT: Anfrage-Übergabe richten wir ein` · `KI: Diktat wird Position — bauen wir` → entfernt (H2) · `KI: Rapport auslesen — bauen wir` → entfernt (H2) · `KI: Wartungserinnerung bauen wir` → entfernt (H2).

Der Tag aus H6 heisst `IT: Telefonie & Postfach richten wir ein` statt des vorgeschlagenen `IT: Telefonie & gemeinsames Postfach`: dieser hätte gegen zwei harte Regeln verstossen (kein «richten wir ein»; mit Anhängen 7 Wörter). Das «gemeinsame Postfach» steckt jetzt in diesem Tag, WhatsApp im eigenen `IT: WhatsApp richten wir ein`.

### Ergebnis der Automatisierungs-Prüfung (H2, Wartungserinnerung)

Geprüft: [Wie kann man Automatisierungen einstellen?](https://doku.noovi.ch/support/solutions/articles/103000365038-wie-kann-man-automatisierungen-einstellen-) und, weil eine Quelle für eine inhaltliche Entscheidung zu dünn ist, zusätzlich [Was sind Aufgaben …?](https://doku.noovi.ch/support/solutions/articles/103000326855-was-sind-aufgaben-und-was-ist-der-unterschied-zur-planung-arbeitsplan-).

Befund: Die Engine arbeitet nach dem **Wenn/Dann-Prinzip**, dokumentiert ist als Auslöser ein **Statuswechsel** (Beispiel: Projekt erhält Status «abgeschlossen» → Aufgabe erstellen), als Aktion «Aufgabe erstellen», dazu Variablen und Webhook-Versand. **Ein zeitbasierter Auslöser ist nirgends dokumentiert.** Aufgaben haben genau ein Datum («Sie legen für jede Aufgabe ein Datum fest», «Wird dieses Datum erreicht, erscheint die Aufgabe auf der App-Startseite») — keine Serie, kein Intervall, keine Wiederholung.

Entscheid nach Auftrag also **«nein»**: Tag entfernt, keine Einrichtung und kein Eigenbau versprochen, die Grenze steht im Text — «Wartungsintervalle auf Kundenobjekten führt sie nicht, diese Liste bleibt im Büro». Ein Ereignis-Trigger wäre technisch da, aber ein Wartungsintervall ist kein Ereignis, sondern ein Datum in der Zukunft. **Für den Democall:** ob die Oberfläche mehr Auslöser anbietet als die Doku zeigt — die Doku ist ausdrücklich ein Basis-Beispiel, keine vollständige Liste.

### `AREAS` neu — a2 kommt nirgends mehr vor

```js
/* a1 = IT & Daten (oben links) · a4 = Website (oben rechts)
   a3 = Handwerker-Software (unten rechts, traegt seit Teil H die Software)
   abuch = bexio (unten links) · a2 = Mitte, statisch, NIE in AREAS */
1:['a4'], 2:['a1','a3'], 3:['a3','abuch'], 4:['a3','abuch'], 5:['a3'],
6:['a3'], 7:['a3','a1'], 8:['a3','abuch'], 9:['a4','a3','a1']
```

Die Umbenennung ist bewusst **ohne Schlüsseltausch** gelöst: `a3` behält seinen Schlüssel und seinen Pfad und wechselt nur die Bedeutung (KI → Handwerker-Software), `a2` behält Pfad und Position und wird zur Nabe. Damit gibt es keine halb umbenannten Vorkommen. Gegen Verwechslung steht der Kommentarblock direkt über `AREAS`; `a2` in `AREAS` einzutragen ist dort ausdrücklich als Fehler markiert.

`AREAS[9]` enthält jetzt `'a1'` — damit ist der seit der Nachbesserungsrunde offene Tag-↔-Zahnrad-Bruch in Schritt 9 (`IT: Terminbuchung` ohne leuchtendes IT-Zahnrad) geschlossen.

### Zwei Nebenfunde, mitkorrigiert

1. **Die Ripple-Ringe für `a3` und `a4` waren vertauscht.** Die Ringe (das Aufleuchten beim Antippen) sassen auf `a3` → oben rechts und `a4` → unten rechts, die Zahnräder und Labels aber umgekehrt. Vor Teil H fiel das kaum auf, weil beide Ecken oft zusammen leuchteten; mit der Software unten rechts wäre es ein sichtbarer Fehler geworden. Ringe sitzen jetzt auf ihren eigenen Zahnrädern.
2. **Der Ring der Mitte ist entfernt** — er konnte nach der neuen Regel nie mehr feuern (`a2` ist in keinem Schritt aktiv), wäre also toter Code mit falscher Aussage. `'a2'` ist auch aus der Lab-/Ring-Schleife heraus.

### Beschriftung der Mitte — vermessen, nicht geschätzt

Zuerst zweizeilig «Sie und / Ihr Team» im alten `a2`-Slot gesetzt und im Browser vermessen (`getBBox()`, viewBox-Einheiten, rechter Rand 380):

| Variante | Kasten | Befund |
|---|---|---|
| «Sie und» y=143 | x 224–333.9, y 110.3–151.6 | überlappt das Website-Zahnrad (Kasten bis y 128) |
| «Ihr Team» y=176 | x 224–349.2, y 143.3–184.6 | überlappt das Software-Zahnrad (Kasten ab y 171) |
| **«Ihr Team» einzeilig y=158** | x 224–349.2 | **kollisionsfrei, gewählt** |
| «Ihr Betrieb» einzeilig | x 224–379.4 | passt nur bündig am Rand |

Zwei Zeilen gehen an dieser Stelle nicht: zwischen den beiden rechten Satelliten liegen 43 viewBox-Einheiten, zwei Zeilen à Schriftgrad 30 brauchen rund 60. Gewählt ist deshalb **«Ihr Team»**, einzeilig, im exakt gleichen Slot, Grad und Ton wie die Bereichslabels, dauerhaft sichtbar. Das Label der Handwerkersoftware bleibt an der alten `a3`-Position (260.3, 268.3) und ist dort lesbar: Kasten x 192.7–328.5 — vergleichbar mit «Website» (238.1–360.8), kein Konflikt mit «bexio» (bis x 61.9). Geometrie unangetastet.

### Konsistenz in den Nachbardateien

`zahnrad-animation.html` **nachgezogen** — es ist dieselbe Systemkarte (mit Buchhaltung als Satellit) und die Ecken stimmen sogar überein: Satellit 0 oben links, 1 oben rechts, 2 unten rechts, 3 unten links.

| Fundstelle | vorher | nachher |
|---|---|---|
| `areas()` Satellit 2 | `['KI &', 'Automatik']` | `['Handwerker-', 'Software']` |
| `center.lines` | `['Handwerker-', 'Software']` | `['Sie und', 'Ihr Team']` |
| SVG `<title>` | «Handwerker-Software: alle Bereiche greifen ineinander» | «Vier Bereiche greifen ineinander — in der Mitte Sie und Ihr Team» |
| `iframe title` (Elternseite) | dito | dito |

Nicht angefasst: die Gradient-IDs `gearKI`/`faceKI` und die lokale Variable `kiOpacity` in derselben Datei. Sie tragen keinen sichtbaren Text; ein Umbenennen wäre reine Kosmetik mit Bruchrisiko. Im Zentrum ist die Beschriftung zweizeilig möglich, weil dort 364 Einheiten Durchmesser zur Verfügung stehen.

`werkzeugkasten.html` **nicht geändert** — dort ist «KI & Automatisierung» *Bereich 3 von 4 unseres Leistungsportfolios*, nicht ein System in der Kundenlandschaft (die vier sind Software & Prozesse, IT, KI & Automatisierung, Website — bexio fehlt, weil es keine Leistung von uns ist). Die Elternseite überschreibt den Abschnitt mit «Vier Sachen müssen laufen. Alle vier machen wir.» Ein Streichen wäre eine Portfolio-Entscheidung, keine Konsistenzkorrektur. **Aber:** die drei Beispiele unter Bereich 3 («Rechnung schreibt sich selbst», «Offerte ohne Aufwand», «Keine Zettel mehr abtippen») sind nach den noovi-Funden alle drei Standardfunktionen der Handwerker-Software — dieselbe Verwechslung eine Ebene höher. Liegt beim Auftraggeber zur Entscheidung.

### Prüflauf nach Teil H

| Prüfung | Ergebnis |
|---|---|
| Tags gesamt | **25**, 0 Regelverstösse |
| `KI:`-Präfix | **0 Treffer** |
| `IT:`-Tags mit «richten wir ein» | 5 von 5 |
| `Website:`-Tags mit «bauen wir» | 3 von 3 |
| Tag-Länge max. 6 Wörter | 0 Überschreitungen (längste: 6) |
| Preise in Tags | keine |
| Volltext `Meisterwerk`, `CHF`, `falls möglich`, `GPS`, `SharePoint`, `M365` | je 0 Treffer |
| «bauen wir» im Fliesstext | nur noch Chatbot, Service-Formular, Wartungsabo — alle drei sind echte Eigenbauten auf der Website |
| Tag gegen Aufklapp-Text, alle 9 Schritte | gelesen, kein Widerspruch |
| iframe-Höhe über alle 9 Aufklapp-Elemente | folgt dem Inhalt, grösster Überhang **−2 px** |
| Optik | Screenshots Schritt 1, 2, 5, 8, 9 und die Zahnrad-Animation geprüft, Layout intakt |

`Telefonie` hat jetzt **1 Treffer** — gewollt (H6). Die alte Null-Regel galt der *KI-Telefonie*, die weiterhin nirgends vorkommt.

Höhenverlauf: geschlossen 1752 px · S1 2262 · S2 2523 · S3 2142 · S4 2200 · S5 2035 · S6 2368 · S7 2320 · S8 2692 · S9 2224.

### Offen aus Teil H

- **Mitte optisch:** die Nabe bleibt dauerhaft im kalten Blau der nicht leuchtenden Bereiche — konsequent zur Regel «nie auf, nie ab», sie wirkt dadurch aber ruhiger als die leuchtenden Systeme. Eine eigene, statische Farbe für die Nabe wäre möglich, ist aber ein Design-Eingriff und deshalb nicht gemacht.
- **werkzeugkasten.html:** siehe oben, Portfolio-Entscheidung.
- **Widerspruch auf remastoren.ch:** «Wir sind 24×7 für Sie erreichbar» gegen die Footer-Öffnungszeiten Mo–Fr 07:00–17:00. Auftragsgemäss **nicht** in den Ablauf aufgenommen, nur gemeldet.

---

## Teil I – Feedback BW vom 29.07.2026 (Spontaneindrücke) + Textlänge

**Quelle:** `AW Demo Emsat - Spontaneindrücke BW 29.7.26.msg`. Die Zuordnung Kommentar ↔ Screenshot stammt aus dem **RTF-Body** der Mail (die sieben Bilder stecken zwischen den Stichworten); der Klartext-Body allein führt bei zwei Punkten in die Irre.

**Sicherungen:** `REMA_Storen_Demo_v3.html.bak_vor_BW`, `auftragsfluss.html.bak_vor_kurz`

### Umgesetzt

| Nr. | Rückmeldung | Umsetzung |
|---|---|---|
| I1 | «Zwingend: erstellt von Amplifyr, **Datum**» | **August 2026** an vier Stellen identisch: Vorschau-Leiste, Kopf-Chip, Betriebs-Karte («Stand August 2026»), Footer («Erstellt im August 2026»). Vorher widersprachen sich «Vorschau · 2026» und «Stand Juli 2026» |
| I2 | «Unklar – geht es um euch oder um REMA? Warum sein Foto?» | Variante (b) gewählt: Label **«Wer bei uns dahintersteht» → «Wer diese Vorschau gebaut hat»** — «bei uns» las auf seiner Seite als *REMA*. Am Hero-Foto steht jetzt die Quelle: «Foto und Zitat von Ihrer Website, remastoren.ch» |
| I3 | «Ergänzen: Gelernter Handwerker + MSc Data Science (dito für Timo und Sinan)» | Hero-Chips mit Doppelqualifikation: «Gelernter Handwerker · MSc Data Science», «Kennt die Verwaltungen · MSc Real Estate», «Systemtechniker EFZ · 10 Jahre IT». Alle drei durch die Team-Karten gedeckt, keine neuen Behauptungen; bleiben auf Desktop und Mobil einzeilig |
| I4 | «‹Ein Auftrag bei Ihnen› >> unklar» | war beim Eintreffen des Feedbacks **schon erledigt** (Titel heisst «Wie Aufträge 2026 optimal laufen, am Beispiel von REMA Storen.») |
| I5 | «Wofür setzen Sie ihre Arbeitszeit ein? Einen Teil ins Handwerk. Zu viel ins Büro.» | Eyebrow und Titel übernommen. Behebt zugleich einen Selbstwiderspruch: die Unterzeile sagt «Sie sind den halben Tag beim Kunden» — der alte Titel «Nicht ins Handwerk» behauptete das Gegenteil |
| I6 | «Die Büroarbeit wird nicht weniger, und wer diese bisher erledigt, wird nicht ersetzt» | übernommen, mit einer Korrektur an ihrer Fassung: Subjekt ist jetzt «die Büroarbeit», also «**sie** wartet nur nicht mehr auf Sie» statt «es wartet» |
| I7 | Zwei fehlende Einwände (gelbe Markierung auf der Lücke in der Chip-Reihe) | «Zu teuer für meinen kleinen Betrieb» → ein Bereich zuerst und nur der wird bezahlt, Vorhandenes wird nicht ersetzt, Kosten neben die zurückgewonnenen Bürostunden gestellt. «Zu kompliziert für mich und mein Team» → nichts Neues lernen (fotografieren, sprechen, freigeben), keine zusätzlichen Programme, eine Nummer statt vier. **Keine Preise**, wie in der ganzen Demo. Abgrenzung zum bestehenden «Wenn meine Leute nicht mitmachen»: der ist über die Monteure draussen, der neue über den Chef selbst |
| I8 | «… macht Angst, überfordert evtl.» (markiert: «Zusammen bauen wir einen Handwerksbetrieb **von A bis Z um**») | Entschärft zu «Wir decken alle vier Bereiche ab — Technik, Aufträge, Telefon, Auftritt —, statt nur ein Stück davon. Mit welchem wir anfangen, entscheiden Sie; umgebaut wird nichts, was funktioniert.» Der alte Satz widersprach vier anderen Stellen der Seite («Sie starten mit einem Bereich», «was läuft, läuft weiter», «zwei Dinge statt zehn») |
| I9 | Idee: «2-spaltig: 1 Spalte Rema-Situation, 1 Spalte eure Kommentare» | Ohne neue Sektion gelöst: die **Betriebs-Karte war schon die Spalte «Rema-Situation»** (alle vier Zeilen von remastoren.ch). Sie hat jetzt eine zweite Spalte mit unserem Kommentar, gold abgesetzt — je Zeile ein Fakt von ihnen und die Konsequenz daraus (sieben Marken → Typenschild-Foto; Verkauf bis Service im eigenen Haus → eine Auftragsnummer; Öffnungszeiten mit Notfall → Warteschleife statt ein Apparat). Auf Mobil stapelt sie unter die Angabe, darum heisst die Orientierungszeile nicht «links/rechts» |
| I10 | «Annahmen zum Auftrags-Prozess stimmen nicht → Kunde fühlt sich nicht verstanden» | **Annahmen-Kasten über dem Ablauf.** Nennt die vier Stellen, an denen wir raten (Anfragekanäle, Warenfluss, Montage im eigenen Team, Verwaltungen als Kundschaft), jeweils mit der Konsequenz, und lädt zur Korrektur ein: «Wo das nicht stimmt, ist nicht der Vorschlag falsch, sondern unsere Annahme.» Das ist die einzige ehrliche Lösung, solange Demos **vorab** verschickt werden — die Prozessfakten liegen zum Zeitpunkt des Baus nicht vor |
| I11 | Onepager: Navigation | **Beide Nav-Buttons ganz entfernt** («Über uns», «Unsere Dienstleistungen»), zuerst nur die ↗-Pfeile. Im Kopf bleibt der Datums-Chip. Die Abschnitts-IDs `#ueberuns` und `#leistungen` bleiben bestehen — die CSS-Regeln `.topnav a.wink` sind jetzt ungenutzt, aber harmlos |
| I12 | **Textlänge:** kompakt, «So machen wir das» | In zwei Durchgängen gekürzt. Erst auf 3–4 Sätze, dann auf **2–3 Sätze und 267–460 Zeichen** (vorher 379–1711). Je Schritt: S1 918→372, S2 1304→375, S3 602→312, S4 642→381, S5 379→267, S6 1083→399, S7 952→396, S8 820→460, S9 650→380. Nebeneffekt: die Kästen sind jetzt alle etwa gleich hoch (offene Höhen 1987–2103 px statt 2010–2692), der Ablauf springt beim Auf- und Zuklappen deutlich weniger. Priorität beim Kürzen: konkreter Nutzen, dann die ehrliche Grenze, dann alles andere |

### I13 — Ein gelber Kasten pro Bereich

Neue harte Regel: je Schritt **genau ein Tag pro leuchtendem Zahnrad**, nie zweimal dasselbe Präfix. Zusammengepackt statt aufgezählt, kurz gehalten. **25 → 16 Tags.**

| Schritt | Zahnräder | Kasten (Wörter) |
|---|---|---|
| 1 | Website | `Website: Chatbot & Formulare bauen wir` (5) |
| 2 | IT · Software | `IT: Telefonie & Kanäle richten wir ein` (6) · `Software: Anfrage mit Status & Bewertung` (5) |
| 3 | Software · bexio | `Software: Aufmass wird Offerte` (4) · `bexio: Produktkatalog wird synchronisiert` (4) |
| 4 | Software · bexio | `Software: Bestellung, Verbrauch & Belege` (4) · `bexio: Kreditor & Zahllauf` (3) |
| 5 | Software | `Software: Liefertermin & Aufgabe am Auftrag` (5) |
| 6 | Software | `Software: Plantafel, Zeit & Chat am Auftrag` (6) |
| 7 | Software · IT | `Software: Unterschrift gibt Verrechnung frei` (5) · `IT: Ablage & Aufbewahrung richten wir ein` (6) |
| 8 | Software · bexio | `Software: Rechnung, Mahnwesen & Nachkalkulation` (4) · `bexio: Zahlungsabgleich, Lohn & Buchhaltung` (4) |
| 9 | Software · IT · Website | `Software: Objekthistorie & Abo-Rechnung` (3) · `IT: Terminbuchung richten wir ein` (5) · `Website: Wartungsabo abschliessen — bauen wir` (5) |

Zusammengelegt wurden: Chatbot + Service-Formular (S1) · drei IT-Einrichtungen zu Telefonie & Kanäle (S2) · Bestellung + Verbrauch + Eingangsrechnung zu «Belege» (S4) · Plantafel + Zeit + Chat (S6) · Unterschrift + Rapport-Freigabe (S7) · Rechnung + Mahnwesen + Nachkalkulation (S8). Die Einzelaussagen stehen weiter im Fliesstext, nur nicht mehr als eigener Kasten. Geprüft wird jetzt maschinell gegen `AREAS`: Anzahl und Präfixe der Kästen müssen den leuchtenden Zahnrädern genau entsprechen — Schritt 9 hat deshalb drei Kästen, Schritt 6 nur einen.

Höhe danach: geschlossen 1752 px, Schritt 8 offen 2238 px, Überhang −2 px.

### Was durch die Kürzung aus dem Ablauf gefallen ist

Nach dem **zweiten** Durchgang zusätzlich weg: der Rückverweis «was Sie bei der Montage gemessen haben, bestimmt, was Sie beim nächsten Mal offerieren» (H7 — die Nachkalkulation selbst bleibt, mit der Kernzahl «auf acht kalkuliert, sechs verkauft»), die Griesser-/Somfy-Katalog-Grenze in Schritt 3, «Nachfassen mit Erinnerung — anrufen tut ein Mensch» in Schritt 3 (steht weiter in Schritt 2), die Objekthistorie-Begründung über den Garantiefall in Schritt 9 und die Feldliste des Chatbots in Schritt 1 (Stockwerk, privat/Verwaltung). Der Kategorie-E-Satz ist erhalten, jetzt als Halbsatz in Schritt 7 («wer bei einer Verwaltung unterschreibt, klären wir im Setup») — damit bleibt Punkt 2 erfüllt.


Bewusst geopfert, weil 3–4 Sätze nicht alles tragen. Falls einzelne Punkte zurück sollen, gehören sie in den Democall statt in den Text:

- **Prinzip** «Gemahnt wird immer dort, wo die Rechnung entsteht» (war fett, aus Punkt 44/G3)
- **Telefonie-Details** aus H6: Voicemail-zu-Mail, individuelle Geschäftsnummern pro Person mit Kundenkontakt, Überlauf nach definierter Zeit → verdichtet auf «klingelt im ganzen Büro statt auf einem Apparat» und «Ansage ausserhalb der Bürozeit»
- **Der Entlastungs-Halbsatz** aus H5 (sichtbare Zuständigkeiten auf der Website → nicht mehr jeder verlangt den Chef)
- **Rüstliste** und **Bedarfsmeldung aus der App** (G6 / Punkt 58)
- **Abschläge nach Leistungsstand und Schlussrechnung** (G3), **Stornorechnung und Server in der Schweiz** (H6)
- Zwei der drei **Kategorie-E-Sätze** («prüfen wir im Setup»): die in Schritt 3 und 6 sind weg, der in Schritt 7 bleibt — die Regel aus Punkt 2 ist damit weiter erfüllt
- Der **Sieben-Marken-Nutzen** ist nicht verloren, sondern gewandert: er steht jetzt in der Kommentarspalte der Betriebs-Karte (I9)

### Faktische Abschwächung, absichtlich

«Die Geschäftsnummer klingelt bei **beiden Bürokräften**» wurde zu «**im ganzen Büro**». Die Zahl zwei ist eine Annahme, und der Auftraggeber hat bestätigt, dass die Betriebsgrössen vor dem Gespräch nicht bekannt sind. Dasselbe gilt für die Kommentarspalte: dort steht keine Team- oder Personenzahl.

### Nicht umsetzbar — bleibt Gesprächsstoff

Ihr zweites Beispiel für eine falsche Annahme, «‹Bis die Ware da ist› anstatt Lieferung durch REMA», lässt sich ohne Fakten nur wieder erraten. Der Schritt bleibt deshalb unverändert, ist aber im Annahmen-Kasten ausdrücklich als Annahme markiert. Offene Fragen: Bestellung pro Auftrag oder ab Lager · Lieferung auf die Baustelle oder in die Werkstatt · eigene Konfektion · Verhältnis Telefon zu Mail bei Anfragen · wer das Büro macht.

Ihre beiden Prozess-Empfehlungen («zuerst den Prozess erklären lassen», «Vorschläge persönlich vorstellen») betreffen den Verkaufsablauf, nicht die Seite. Sie widersprechen sich mit dem Vorabversand allerdings nur scheinbar — der Annahmen-Kasten löst das auf.

---

## Teil J – Durchleuchtung mit der Handwerker-Brille (31.07.2026)

Eigene Prüfung der ganzen Seite plus beider iframes, ohne Annahme, dass Bestehendes richtig ist. **Sicherungen:** `REMA_Storen_Demo_v3.html.bak_vor_review`, `auftragsfluss.html.bak_vor_review`, `zahnrad-animation.html.bak_vor_review`

| Nr. | Fund | Korrektur |
|---|---|---|
| J1 | **Der Browser-Titel gab die Seite als REMA's eigene Website aus:** «REMA Redza Storen & Rollladen — Ihr Partner für Sonnenschutz · Vorschau 2026». Das ist sein Slogan; im Tab, im Lesezeichen und beim Weiterleiten stand damit seine Firma als Absender — derselbe Verwechslungsfehler, den BW im Hero gefunden hat, an der Stelle, die man zuletzt anschaut | → «REMA Storen — Vorschau von Amplifyr · August 2026» |
| J2 | **Sachlich falsch:** «Neue Programme kommen keine dazu» (Einwand «Zu kompliziert», aus Teil I). Die Demo schlägt Handwerker-Software, Chatbot, Terminbuchung und Telefonie vor — vier neue Programme | → «**Ein System kommt dazu, nicht fünf** — einrichten tun wir es, und was niemand braucht, lassen wir weg.» |
| J3 | **Widerspruch zum Verkaufsversprechen:** «Die Büroarbeit wird **nicht weniger**» gegen «durchrechnen, wie viel Bürozeit drinliegt» und «neben die Bürostunden, die es Ihnen zurückgibt». BW's Absicht war «die Person wird nicht ersetzt» | → «Die Büroarbeit **verschwindet nicht**, und wer sie bisher erledigt, wird nicht ersetzt» |
| J4 | **Widerspruch in einer Zeile der Betriebs-Karte:** Wert «… · 24/7 im Notfall», Kommentar «ausserhalb der Zeiten Voicemail». Dazu war «24/7 im Notfall» unsere Deutung des widersprüchlichen «24×7 erreichbar» auf remastoren.ch, ausgewiesen aber als *seine* Angabe | → Wert auf die belegten Öffnungszeiten reduziert, Kommentar auf «was nach Feierabend reinkommt, liegt am Morgen als Mail im Postfach». Der 24/7-Widerspruch auf seiner Website bleibt Gesprächsstoff, wird ihm aber nicht auf der Seite vorgehalten |
| J5 | **Zwei verschiedene «vier Bereiche» auf einer Seite:** im Zahnrad IT, Website, Handwerker-Software, bexio — im Leistungsteil Software, IT, KI, Website. Seit Teil H fällt es auf, weil KI aus dem Zahnrad raus ist und bexio im Portfolio fehlt | → Begriffe getrennt: das Zahnrad zeigt **Systeme** («Welches System trägt das», aria-label, SVG-Titel der Animation, iframe-Titel), «Bereiche» bleibt für unsere Leistungen. Der Werkzeugkasten ist auftragsgemäss unangetastet |
| J6 | **Toter Link:** «Genau das bauen wir.» am Ende des Ablaufs zeigt auf `#leistungen`, steckt aber im iframe — der Browser suchte das Ziel dort. Seit die Nav-Buttons weg sind, war das der einzige Klickweg zum Leistungsteil | → `target="_parent"` |
| J7 | **CTA-Arithmetik:** «Fünfzehn Minuten, live an Ihrem Betrieb: Abläufe anschauen, durchrechnen … Die Auswertung behalten Sie in jedem Fall.» In 15 Minuten vor Ort entsteht keine Auswertung | → «Zwanzig Minuten am Telefon — oder eine Stunde bei Ihnen, wenn Sie es genau wollen» |
| J8 | **Unklares Subjekt im CTA-Titel:** «Nach dem nächsten Sturm der Erste, der zurückruft» — wer ruft zurück? | → «Nach dem nächsten Sturm **sind Sie** der Erste, der zurückruft.» |
| J9 | **Die zwei Schlussabsätze des Ablaufs waren der schwerste Text der Seite** (416 + 524 Zeichen) — sie hatten beide Kürzungsrunden überlebt, weil nur die neun Kästen angefasst wurden. Darin «es gibt genau eine **Rechnungs-Engine**», MWST, Kreditoren mit Zahlläufen, Jahresabschluss, Artikelstamm | → auf **317 + 285** gekürzt, Architektensprache raus: «Rechnungen entstehen an **einer** Stelle, nicht an zwei — sonst mahnt ein System, was ein anderes ausgestellt hat.» Treuhänder-Alternative bleibt als ein Satz (Punkt 20/57), KI-Satz und «entschieden wird im Betrieb» bleiben |
| J10 | **Der Sturm fehlte im Ablauf, obwohl der Abschluss mit ihm verkauft** («Rechtzeitig zur Herbst- und Sturmsaison»). Die Antwort war längst eingebaut, nur nicht verbunden | → Halbsatz in Schritt 1: «Nach einem Sturmwochenende landen die Meldungen als Service-Anfragen statt auf zwanzig Notizzetteln.» Gegenfinanziert durch eine gestraffte Feldliste, Schritt 1 bleibt bei 3 Sätzen (428 Zeichen) |
| J11 | **Der Alt-Text behauptete, wer auf dem Hero-Foto ist** («Herr Redza — REMA Storen, Zürich») — nicht überprüfbar, und der Hero spricht ihn persönlich an | → «Ein Mitarbeiter von REMA Storen mit einer Storen-Lamelle». **Vor dem Versand prüfen:** ist der Mann auf dem Foto wirklich Herr Redza? |
| J12 | **Zu grosse Zusage:** «ein Betrieb, der **läuft**, wenn Sie zwei Wochen weg sind» — bei einem Familienbetrieb mit dem Chef im Verkauf | → «der **nicht stillsteht**, wenn Sie zwei Wochen weg sind» |

### Nicht korrigiert, bewusst

- **Werkzeugkasten** (auftragsgemäss): «Offerte ohne Aufwand: Aus der Anfrage entsteht die Offerte» widerspricht dem Ablauf, der die Positionen ausdrücklich dem Büro zuschreibt. Ebenso «Offerte in 10 Minuten» und «Rechnung schreibt sich selbst». Alle drei Beispiele unter «KI & Automatisierung» sind noovi-Standardfunktionen. Bleibt offen.
- **Die Hero-Chips mit akademischen Titeln** («MSc Real Estate», «10 Jahre IT»): BW hat die Doppelqualifikation ausdrücklich verlangt, also kein Fehler. Das Risiko bleibt, dass drei Studierte einem Handwerker sein Handwerk erklären; nur David's Chip verbindet Werkstatt und Studium.

### Prüfung nach Teil J

Titel im Browser korrekt, Link im iframe trägt `target="_parent"`, Zahnrad-Überschrift «Welches System trägt das», keine Konsolenfehler, Höhe folgt über alle neun Aufklapp-Elemente (Überhang −2 px, geschlossen 1752 px), 16 Kästen unverändert, Anzahl und Präfixe stimmen mit den leuchtenden Zahnrädern. Optisch geprüft: Hero, Betriebs-Karte, Annahmen-Kasten, Ablauf mit Schritt 1 offen, Schlussabsätze, Einwände, CTA — Desktop und Mobil.

---

## Teil K – Verdichtungsrunde (31.07.2026)

Gemessen statt geschätzt: der Fliesstext lag bei rund 8'900 Zeichen, die Masse in vier Nestern. **Sicherungen:** `REMA_Storen_Demo_v3.html.bak_vor_kompakt`, `auftragsfluss.html.bak_vor_kompakt`

| Nr. | Änderung | vorher → nachher |
|---|---|---|
| K1 | **Annahmen-Kasten** war der teuerste Text der Seite: immer sichtbar, direkt vor dem Ablauf, und viermal «Wir nehmen an, dass». Die Folgesätze («fehlt hier eine ganze Etappe») gehören ins Gespräch, nicht auf die Seite. Vier Halbzeilen als Liste, Einleitung und Schluss je ein Satz — kein Inhaltspunkt verloren. Nebeneffekt: eine kurze Annahme liest sich präzise, eine lange liest sich unsicher | **995 → 483** |
| K2 | **Acht Einwände auf sechs.** «Und wenn meine Leute nicht mitmachen?» und «Zu kompliziert für mich und mein Team» beantworteten dieselbe Sorge (724 Zeichen für eine Frage) → zusammengelegt unter dem Titel von BW, mit deren stärkstem Satz vorne: «Ohne Ihr Team läuft es nicht — das ist uns klar.» «Schon mal reingefallen» ist im Kern dieselbe Antwort wie «Hab schon Software» («wir begleiten, bis es läuft») → dort eingefügt. Chip-Reihe jetzt zwei statt drei Zeilen | **2374 in 8 → 1741 in 6** |
| K3 | **«Wie viel Arbeit ist das für mich?»** war der längste Einzeltext mit fünf Zusagen in einer Antwort — las sich wie ein Vertrag. Behalten: die Büro-Person braucht Zeit, die Stunden rechnen wir vorher durch, Datenübernahme, Parallelbetrieb | **455 → 348** |
| K4 | **Redundanz entdoppelt.** «Sie starten mit einem Bereich, in Stufen» stand vierfach, «Was Sie schon haben, bleibt» dreifach — je als ganzer Satz. Im Leistungs-Intro und im Einwand «zu teuer» gestrichen, an den prominenten Stellen belassen | −110 |
| K5 | **Footer-Disclaimer** gestrafft, alle vier rechtlichen Aussagen bleiben (beispielhaft · keine Veröffentlichung des Betriebs · Quelle der Inhalte · Datum) | **352 → 235** |
| K6 | **Ablauf-Feinschnitt.** Schritt 1: Feldliste des Chatbots raus, dafür «erfasst im Gespräch, was für die Offerte fehlt» — kürzer ist es kaum, aber es ist die Sprache des Handwerkers statt eine Formularliste; der Sturm-Satz aus J10 ist in den Service-Satz eingefaltet, damit Schritt 1 wieder drei Sätze hat statt vier. Schritt 8: «MWST» gestrichen, Nachkalkulations-Satz gestrafft | S1 428 → 429 (3 Sätze) · S8 431 → 412 |

### Stand der neun Ablauf-Kästen

238 · 283 · 346 · 351 · 352 · 367 · 370 · 412 · 429 Zeichen — alle 2 bis 3 Sätze, Spanne jetzt 238–429 (nach Teil G2 waren es 379–1711).

### Bewusst nicht gekürzt

- **Betriebs-Karten-Kommentare** (je ~130): das Konkreteste der Seite, jeder hängt an einem Fakt von remastoren.ch.
- **Team-Karten** (177/174/213): hinter einem Klick, drei parallele Blöcke lesen sich schnell.
- **Der Satz «Angefangen wird immer bei dem, was am meisten weh tut»** unter den Einwänden: klingt wie eine vierte Wiederholung von «in Stufen», sagt aber etwas anderes — Priorität nach Schmerz, nicht nach Preis.

### Was mit K3 verloren ging und in den Democall gehört

«Steigen Sie aus, bekommen Sie alles exportiert» — ein starkes Vertrauensargument, aber der sechste Halbsatz einer Antwort. Gehört gesagt, nicht geschrieben.

### Prüfung nach Teil K

Sechs Chips, alle sechs Panels schalten (durchgeklickt), keine Konsolenfehler, Höhe folgt über alle neun Aufklapp-Elemente (Überhang −2 px), 16 gelbe Kästen unverändert deckungsgleich mit den leuchtenden Zahnrädern. Optisch geprüft: Annahmen-Kasten und Einwand-Bereich.

---

## Teil L – Dritte Verdichtung, Betriebs-Karte, Generalunternehmer (31.07.2026)

**Sicherungen:** `REMA_Storen_Demo_v3.html.bak_vor_punkt`, `auftragsfluss.html.bak_vor_kompakt`

### L1 – Die neun Kästen ein drittes Mal, nach Prinzip

Neues Prinzip statt Wortklauberei: **der gelbe Kasten sagt, was es ist — der Text sagt, was sich ändert, und wo die Grenze liegt.** Aufzählungen, die der Tag schon trägt, sind aus dem Fliesstext raus.

| | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | Σ |
|---|---|---|---|---|---|---|---|---|---|---|
| vor Teil L | 429 | 346 | 283 | 352 | 238 | 370 | 367 | 412 | 351 | 3148 |
| nach Teil L | 299 | 291 | 255 | 270 | 238 | 309 | 325 | 343 | 308 | **2638** |

Alle 2–3 Sätze, Spanne 238–343 (nach Teil G2: 379–1711). Geschlossene Höhe des iframes **1752 → 1563 px**.

**Zwei Rücknahmen im selben Durchgang, weil die Kürzung zu weit ging:**
- Schritt 1 hatte die Kernaussage des Chatbots verloren («erfasst dabei, was für die Offerte fehlt») — das war der Punkt von H4: er beantwortet nicht nur, er erfasst. Wieder drin.
- Schritt 4 hatte bexio nicht mehr erwähnt, obwohl das bexio-Zahnrad dort leuchtet und der Tag `bexio: Kreditor & Zahllauf` heisst. «verbucht wird sie in bexio» ist zurück.

**Was in diesem Durchgang gefallen ist:** der Sturm-Satz aus J10 (die CTA-Klammer ist damit wieder offen) · «Anrufe der Monteure zeigen die Geschäftsnummer, nie die private» in S2 (die Regel steht in S6 stärker) · «mit Foto und Skizze» (S3) · «bestellt wird von Hand beim Lieferanten» und «Verbrauch buchen die Monteure mobil» (S4, Punkt 58) · «ein Chat nach Personen sortiert ist dann wertlos» (S6) · «das prüft ein Mensch» in S8 (die Freigabe steht im Folgesatz) · die Objekt-Enumeration «Typ, Masse, Motor, Farbe, Lieferant» (S9).

### L2 – Die zwei Schlussabsätze sind einer, 602 → 299 Zeichen

Auf die Frage «brauchts das in dem Ausmass?»: nein. Beide Absätze sagten dasselbe zweimal («genau eine Rechnungs-Engine» / «genau ein führendes System»), dazu Sonderfälle, die ein Handwerker an dieser Stelle nicht fragt. Neu ein Absatz:

> Jede Sache liegt in **genau einem System** — Offerte, Rapport und Rechnung in der Handwerker-Software, Buchhaltung und Lohn in bexio. Die KI steckt dabei in den Werkzeugen, nicht als zusätzliche Schicht darüber. **Entschieden wird im Betrieb** — die Arbeit steckt in den Übergängen, und *genau das bauen wir*.

**Achtung, das ist eine Rücknahme einer früheren Vorgabe:** der Treuhänder-Fall («Will Ihr Treuhänder es strikt anders, entstehen sie in bexio — dann tippt Ihr Büro die Positionen ab») war nach Punkt 20/57 ausdrücklich als *ein Satz* gefordert und ist jetzt von der Seite weg. Er gehört ins Gespräch, sobald der Treuhänder überhaupt zur Sprache kommt. Ebenfalls weg: «sonst mahnt ein System, was ein anderes ausgestellt hat» und die bexio-Aufzählung (MWST, Kreditoren mit Zahlläufen, Jahresabschluss, Artikelstamm).

### L3 – Betriebs-Karte: Beobachtungen statt Verkaufsschlüsse, 530 → 159 Zeichen

Der Einwand des Auftraggebers trifft den Kern: die Karte soll bewirken, dass er sich **verstanden** fühlt, nicht dass er überzeugt wird. Dazu kam ein Fund: **alle vier Kommentare wiederholten Schlüsse, die 200 px weiter im Ablauf ohnehin stehen** (Aufmass am Objekt → S3, eine Auftragsnummer → S6/S9, Typenschild-Foto → S1, Warteschleife → S2). Dreimal begann der Kommentar mit «Darum …».

| Zeile | vorher (≈130 Zeichen) | jetzt |
|---|---|---|
| 01 Produkte | «Vier Produktgruppen … Darum wird das Aufmass am Objekt erfasst und nicht abends abgetippt.» | «Vier Produktgruppen, **jede mit eigenen Massen.**» |
| 02 Leistungen | «… deshalb hängt der ganze Ablauf an einer Auftragsnummer, auch der Garantiefall Jahre später.» | «Von der Offerte bis zum Service **in einer Hand.**» |
| 03 Marken | «Sieben Marken heisst sieben Bestellwege. Darum spart das Foto vom Typenschild …» | «Sieben Marken, **sieben Bestellwege.**» |
| 04 Erreichbar | «Wer montiert, kann nicht abnehmen. Darum Warteschleife und Ansage statt ein Apparat …» | «**Wer montiert, kann nicht abnehmen.**» |

Orientierungszeile: «Ihre Angaben von remastoren.ch — dazu unser Kommentar, was das für den Ablauf heisst» → «**Von Ihrer Website gelesen — und was uns daran aufgefallen ist.**»

### L4 – «Digitaler Generalunternehmer» kam nirgends vor

Volltextsuche über die Demo **und das ganze Repository: 0 Treffer.** Der Gedanke stand da (die Zange im Werkzeugkasten, «Alle vier machen wir», «aus einer Hand»), das Wort fehlte — obwohl es die beste Übersetzung für einen Handwerker ist: einen GU kennt er, der übernimmt den ganzen Bau und koordiniert die Unternehmer.

Jetzt an zwei prominenten Stellen:
- **Eyebrow über dem Leistungsteil:** «Wer macht das alles? · **Ihr digitaler Generalunternehmer**» (Grossbuchstaben, direkt über «Vier Sachen müssen laufen. Alle vier machen wir.»)
- **Footer-Zeile:** «Amplifyr · **Ihr digitaler Generalunternehmer**: IT, Software, Automatisierung & Auftritt aus einer Hand»

**Offen zur Entscheidung:** ein Generalunternehmer trägt beim Bau die Verantwortung für das ganze Werk, auch für die Subunternehmer. Wer sich so nennt, wird an dieser Erwartung gemessen — inklusive der Systeme, die nicht von uns sind (bexio, noovi, M365). Wenn das gewollt ist, ist es das stärkste Wort der Seite; wenn nicht, wäre «ein Ansprechpartner für alle vier» die kleinere Zusage.

### Prüfung nach Teil L

16 gelbe Kästen, Anzahl und Präfixe deckungsgleich mit den leuchtenden Zahnrädern, kein `KI:`-Präfix, keine Preise, Kategorie-E-Satz einmal vorhanden (Schritt 7), Höhe folgt über alle neun Aufklapp-Elemente (Überhang −1 px, geschlossen 1563 px), keine Konsolenfehler. Optisch geprüft: Betriebs-Karte und Ablauf-Ende.

---

## Teil M – Positionierung als digitaler Generalunternehmer · Betriebs-Karte halbiert

**Sicherungen:** `REMA_Storen_Demo_v3.html.bak_vor_gu`, `REMA_Storen_Demo_v3.html.bak_vor_karte`

### M1 – Die Positionierung erklärt sich, statt sich zu behaupten

Vorgabe des Auftraggebers: wir positionieren uns als **digitaler Generalunternehmer**, nicht als Software-Anbieter — das ist die Sprache des Handwerkers. Das Wort allein trägt nicht; ein GU ist ein **Rollenbild**, das er aus seinem eigenen Geschäft kennt: er nimmt den ganzen Auftrag, koordiniert die Unternehmer, der Bauherr hat eine Nummer statt sieben — und **er stellt nichts selbst her.** Genau dieser letzte Punkt legitimiert, dass wir noovi, bexio und M365 einsetzen, statt eigene Software zu verkaufen; ohne ihn klingt es nach Wiederverkäufer.

Das Versprechen stand schon auf der Seite («klemmt es zwischen zwei Systemen, ist das unsere Aufgabe», «einer, der zupackt, statt vier, die aufeinander zeigen»). Neu ist, dass es benannt und erklärt wird — kein zusätzliches Versprechen, nur ein Name für ein bestehendes.

| Ort | Was dort steht |
|---|---|
| Eyebrow über dem Leistungsteil | «Wer macht das alles? · **Ihr digitaler Generalunternehmer**» — Grossbuchstaben, direkt über «Vier Sachen müssen laufen. Alle vier machen wir.» |
| Leistungs-Intro (der Kern) | «Wie am Bau: **der Generalunternehmer nimmt den ganzen Auftrag** und koordiniert die Unternehmer — der Bauherr hat eine Nummer, nicht sieben. Genauso machen wir es mit Ihrer Technik. **Eigene Software verkaufen wir keine** — wir nehmen die Systeme, die es gibt, und stehen für das Ganze ein.» Bewusst **länger** als vorher (195 → 339 Zeichen): das ist die einzige Stelle, an der Zuwachs die Positionierung kauft |
| Einwand «Hab schon Software» | neuer erster Satz: «**Wir sind kein weiterer Anbieter, sondern der, der die vorhandenen zusammenhält.**» Dafür ist «wir bauen an, was fehlt, und übernehmen den Betrieb des Ganzen» gekürzt — Länge bleibt gleich |
| Footer | «Ihr digitaler Generalunternehmer **für** IT, Software, Automatisierung & Auftritt» — «für» statt «aus einer Hand» macht aus Liefergegenständen Zuständigkeitsfelder. «Software aus einer Hand» hätte dem Satz «eigene Software verkaufen wir keine» widersprochen |

**Zwei offene Punkte:**
1. **Der natürliche Ort fehlt noch:** der Zangen-Block im Werkzeugkasten *ist* die GU-Aussage («Bei vier Anbietern zeigt jeder auf den anderen: 7 Telefonate, 4 Tage, Auftrag weg. Bei uns rufen Sie einmal an»). Dort steht «Kein fünfter Bereich — greift bei allen vier»; eine Zeile wie «Wie beim Generalunternehmer: einer haftet fürs Ganze» wäre die stärkste Stelle der ganzen Seite. Der Werkzeugkasten ist auftragsgemäss gesperrt — braucht eine Freigabe.
2. **Haftungserwartung:** ein GU trägt am Bau die Verantwortung für das ganze Werk, auch für die Subunternehmer. Wer sich so nennt, wird daran gemessen — inklusive bexio, noovi und M365. Die Seite verspricht das an drei Stellen bereits; das Wort macht es nur explizit.

### M2 – Betriebs-Karte: 665 → 370 px, ohne Inhalt oder Spaltenaufteilung zu ändern

Rückmeldung: Inhalt und Aufteilung gut, aber sie füllt einen ganzen Bildschirm. Gemessen, woher die Höhe kam, dann an sieben Stellen geschnitten:

| Hebel | Wirkung |
|---|---|
| Drei von vier Wertspalten brachen um, weil das dreispaltige Grid aus Teil I sie zu schmal machte | Spalten neu (126px · 1.34fr · 0.86fr), Wertspalte .97rem → **alle vier Zeilen einzeilig**, −70 px |
| Zeilenabstand 17 px → 10 px | −56 px |
| Zitat war im Display-Format (bis 2.05rem) und dopplete die Foto-Beschriftung im Hero | auf Zeilenformat (1.34rem), Abstand 30 → 16 → −56 px |
| Innenabstand der Karte 40/34 → 24/20 | −30 px |
| Abstand über dem Zeilenblock 34 → 16 | −18 px |
| Fusszeile «Familienbetrieb in Zürich — Verkauf, Projektierung, Einbau und Service im eigenen Haus» war eine Dopplung von Zeile 02 | entfernt, «Familienbetrieb» wandert in die Adresszeile → −72 px |
| Kommentare 01 und 02 brachen um (45/46 Zeichen) | «Vier Gruppen, jede mit eigenen Massen.» · «Offerte bis Service in einer Hand.» → −38 px |

Ergebnis **370 px statt 665 (56 %)**, alle vier Zeilen einzeilig, geprüft bei 1400 / 1100 / 900 / 390 px. Mobil 685 px; unter 640 px kippt das Grid wie bisher auf eine Spalte, der Kommentar bleibt am goldenen Strich erkennbar.

---

## Teil N – GU im Werkzeugkasten · Symmetrie im Vergleichsbild (31.07.2026)

**Sicherungen:** `werkzeugkasten.html.bak_vor_gu`, `REMA_Storen_Demo_v3.html.bak_vor_symmetrie`, `zahnrad-animation.html` (Stand aus Teil M im Repo)

### N1 – Der Werkzeugkasten ist entsperrt und trägt jetzt das Rollenbild

Der Zangen-Block war immer schon die GU-Aussage, nur ohne das Wort. Drei Stellen:

| | vorher | jetzt |
|---|---|---|
| Label | «Kein fünfter Bereich · greift bei allen vier» | «Kein fünfter Bereich · **wie beim Generalunternehmer**» |
| Titel | «Alle vier Bereiche, ein Ansprechpartner.» | «Alle vier Bereiche, **einer haftet fürs Ganze.**» |
| Brücke | «… Genau dann sind wir dran: einer, der zupackt …» | «… Genau dann sind wir dran — **wie der Generalunternehmer am Bau**: einer, der zupackt …» |

Im Browser über die Zange gefahren und geprüft: alle drei Zeilen erscheinen.

### N2 – Der Widerspruch aus J4 ist behoben

`Bereich 3 · KI & Automatisierung` versprach «**Offerte ohne Aufwand:** Aus der Anfrage entsteht die Offerte». Der Ablauf sagt seit Teil H ausdrücklich das Gegenteil («Diktieren liefert Text, keine gefüllten Felder — die Positionen erfasst Ihr Büro»). Neu: «**Offerte aus dem Aufmass:** Was Sie am Objekt gemessen und diktiert haben, steht in der Offerte — Sie prüfen und schicken sie raus.»

**Nicht geändert, bewusst:** der Name «KI & Automatisierung» als Bereich 3 (Portfolio-Entscheidung, hängt an «Vier Sachen müssen laufen» und den Chips im Über-uns-Teil) · «Rechnung schreibt sich selbst» (deckt sich mit dem Ablauf: Rechnung entsteht aus dem freigegebenen Rapport, Mensch prüft) · «Offerte in 10 Minuten» und «7 Telefonate, 4 Tage» (rhetorische Zahlen, kein Widerspruch).

### N3 – Vergleichsbild: gleicher Abstand zur Mittellinie

Rückmeldung: die rechte Grafik und ihr Titel sitzen zu weit rechts. Gemessen bei 1400 px: **links 41 px** von der Mittellinie, **rechts 135 px**. Zwei Ursachen, beide behoben:

1. **Die Zahnrad-Grafik war deutlich kleiner als die Chaos-Illustration** (420 px gegen 656 px) und liess dadurch Luft. `.gear-iframe` max-width 530 → 640 px, und im viewBox der Animation die Luft weggenommen: `660 0 1280 1280` → `735 75 1130 1130`. Die Mitte bleibt exakt 1300/640, die Zahnräder (749–1851) passen mit 14 Einheiten Reserve; nur der dekorative Ring wird knapper beschnitten — er war schon vorher angeschnitten. Grafik jetzt **503 px**.
2. **Restversatz** über die Spalte selbst: `.roles .role-col:last-child{transform:translateX(-8.5%)}`, damit Titel und Grafik zusammen wandern. Prozent statt Pixel, damit es mit der Spaltenbreite skaliert; unter 820 px zurückgesetzt, weil das Gitter dort einspaltig wird.

Ergebnis: **41 | 41 px** bei 1200–1600 px, Abweichung 3–4 px bei 1000–860 px.

⚠️ **Falle für den nächsten Prüflauf:** `.reveal{opacity:0;transform:translateY(20px)}` liegt auf derselben Spalte. Die Messskripte setzten bisher `transform:none!important`, um die Einblendung zu überspringen — das überschreibt auch die neue Verschiebung und zeigt fälschlich Asymmetrie. Beim Messen nur `opacity:1!important` setzen und `.roles` in den Viewport scrollen.

---

## Teil O – Lesbarkeit, Hero-Chips, Pfeil, Sorglos-Block (31.07.2026)

**Sicherung:** `REMA_Storen_Demo_v3.html.bak_vor_lesbar`

### O1 – Schriftgrössen: 28 Stufen und 30 zu kleine Elemente

Gemessen statt geschätzt (computed font-size aller 99 Textelemente): **28 verschiedene Grössen**, davon **30 Elemente unter 13 px** und **11 zwischen 10.2 und 11.2 px** — durchwegs Grossbuchstaben mit Sperrung, also die schlechteste Kombination für die Lesbarkeit. Zielgruppe ist ein Handwerker um die fünfzig, oft am Handy und draussen.

| Element | vorher | jetzt |
|---|---|---|
| Eyebrows (6 Stellen) | 11.2 px | **12.5 px** |
| Hero-Label «Wer diese Vorschau gebaut hat» | 10.2 | **12** |
| Annahmen-Label «Bevor Sie weiterlesen» | 10.2 | **12** |
| Kopf-Chip «Vorschau · August 2026» | 10.2 | 11.5 |
| «Stand August 2026» · Kategorien der Betriebs-Karte | 10.9 | **12.2** |
| Rollen-Chip in den Team-Karten | 10.6 | **12.2** |
| Qualifikationslisten im Team | 12.8 | 13.4 |
| Bildquelle am Hero-Foto | 11.5 | 12.6 |
| Saison-Chip · Footer-Badge | 12.5 / 11.8 | 13.4 / 13.1 |
| Zeile unter dem Zitat der Karte | 12.8 | 13.4 |

Dazu die Sperrung (`letter-spacing`) bei den vergrösserten Grossbuchstaben leicht zurückgenommen. Ergebnis: **15 statt 28 Grössen**, und ausser dem Datums-Chip am Kopf (11.5 px, reine Randnotiz) ist nichts mehr unter 12 px.

### O2 – Hero-Chips: drei Gesichter ohne Namen

Rückmeldung: «gute Ansätze, aber einiges nicht klar — und müsste man drüber hovern können?» Der Befund dahinter: drei Fotos, aber **kein Name** — man sah Qualifikationen und wusste nicht, wer wer ist; und es gab keinen Weg zu mehr. Die vollständigen Team-Karten liegen drei Abschnitte weiter unten hinter einem zugeklappten «Team kennenlernen».

Neu: der Chip hat **zwei Zeilen** — Name fett, Qualifikation darunter — und ist ein **Link auf den Team-Bereich**, der beim Klick zugleich **aufklappt** (statt Hover, das auf dem Handy nicht existiert). Hover hebt den Chip jetzt sichtbar hervor. Geprüft: Chip 349 × 56 px am Desktop, 337 × 58 px bei 390 px Fensterbreite, Klick öffnet das Team.

⚠️ Dieser Link war zuerst ein selbstgemachter Fehler: er zeigte auf ein zugeklapptes `<details>`, der Klick lief also ins Nichts. Vier Zeilen JavaScript öffnen es jetzt mit.

### O3 – Der gelbe Pfeil: erst sinnlos, jetzt die Aussage der Seite

Zwei Befunde:
1. **Die vermeintliche Trennlinie ist keine.** Sie ist die 1-px-Kante der Chaos-Illustration (240,240,241 auf 251,252,254) — ein Artefakt des PNG, kein Gestaltungselement. Der Pfeil stand also neben einem Zufall.
2. **Der Pfeil sass nicht in der Mitte der Lücke** (51 px zur Illustration, 93 px zum Zahnrad).

Neu: der Pfeil trägt die Beschriftung **«unsere Arbeit»** — genau das, was der Schlussabsatz des Ablaufs sagt («die Arbeit steckt in den Übergängen»). Damit ist der Zwischenraum zwischen Chaos und Ordnung als unsere Leistung benannt statt als Dekoration. Position: `translateX(10px)`, Abstände jetzt **51 / 47–57 px** bei 1000–1600 px.

⚠️ **Messfalle, die mich zweimal getäuscht hat:** die Zahnräder fliegen beim Erscheinen von aussen ein. Wer vor dem Ende der Animation misst, erhält eine breitere Grafik und damit falsche Abstände — meine erste Meldung «41 | 41 px» aus Teil N war so entstanden. **Mindestens 6 Sekunden nach `scrollIntoView` warten.**

### O4 – Sorglos: drei Folgen des Generalunternehmer-Bildes

Auftrag war, die Positionierung stärker durchkommen zu lassen. Wichtige Präzisierung: **«rundum sorglos» darf nicht «wir machen alles» heissen** — die Seite sagt an sieben Stellen ausdrücklich, was der Betrieb selbst tut (Positionen erfassen, umrechnen, freigeben, von Hand bestellen). Sorglos liegt auf der **Koordinations- und Haftungsebene**, nicht auf der Arbeitsebene. Neu im Leistungsteil, direkt unter dem GU-Absatz:

| | |
|---|---|
| **Ein Anruf statt vier.** | Wer wen fragt, ist unser Problem, nicht Ihres. |
| **Fertig ist, wenn Sie abnehmen.** | Nicht, wenn wir geliefert haben. |
| **Was nicht läuft, ist unser Fehler.** | Sie müssen keinen Schuldigen suchen. |

«Abnahme» ist bewusst gewählt: ein Begriff, den er von der Baustelle kennt. Die erste Zeile holt zugleich die stärkste GU-Aussage aus dem Hover des Zangen-Blocks in den sichtbaren Fliesstext.

---

## Teil P – Die drei offenen Stolpersteine (31.07.2026)

**Sicherungen:** `REMA_Storen_Demo_v3.html.bak_vor_feinschliff`, `zahnrad-animation.html.bak_vor_feinschliff`

| Nr. | Fund | Korrektur |
|---|---|---|
| P1 | **Das Einwand-Akkordeon öffnete mit «Was geht automatisch raus?»** — der Leser landete auf der Antwort zu einer Frage, die er nicht gestellt hat. Zu beachten: das JavaScript öffnet immer `tabs[0]`, die Reihenfolge im Markup entscheidet also | Reihenfolge nach Häufigkeit der Sorge: **«Zu teuer für meinen kleinen Betrieb»** · «Zu kompliziert für mich und mein Team» · «Hab schon Software» · «Bin sowieso ausgebucht» · «Was geht automatisch raus?» · «Wie viel Arbeit für mich?» |
| P2 | **Zwei Namen für dasselbe Zahnrad:** die Animation sagte «Buchhaltung», das Ablauf-Zahnrad «bexio» — 300 px auseinander auf derselben Seite. Beim Nachsehen ein grösserer Fund: **der ganze Ablauf setzt bexio voraus, die Seite sagte das nirgends.** Vier `bexio:`-Tags, aber weder Betriebs-Karte noch Annahmen-Kasten erwähnten es | Animation → «bexio» (rendert einzeilig im gleichen Grad wie «Website»). Und **fünfte Annahme** im Kasten: «Ihre Buchhaltung läuft in bexio» — damit ist die Voraussetzung benannt, statt stillschweigend zu gelten |
| P3 | **Der Hero-Titel sagte nichts:** «Wie Aufträge 2026 optimal laufen, am Beispiel von REMA Storen.» «Optimal» ist ein Wort ohne Inhalt, «2026» eine Jahreszahl ohne Funktion, und der Titel nannte keinen Nutzen | **«Ein Kundenauftrag bei Ihnen — vom ersten Anruf bis zum Geld.»** Nimmt BW's Präzisierung auf («Kundenauftrag», ihre Rückfrage zum alten Titel) und spannt den Bogen, den der Ablauf dann zeigt; «bis das Geld da ist» ist die Sprache der dritten Etappe |

**Zu P3 der Hinweis:** der alte Titel war die Antwort des Auftraggebers auf BW's Kritik am ursprünglichen «Ein Auftrag bei Ihnen, einmal durchgespielt». Die neue Fassung behält das «bei Ihnen», macht aber mit «Kundenauftrag» eindeutig, um wessen Auftrag es geht — genau die Frage, die BW gestellt hatte. Rückweg steht in `REMA_Storen_Demo_v3.html.bak_vor_feinschliff`.

### Prüfung nach Teil P

Hero-Titel, Chip-Reihenfolge, offenes Startpanel, fünf Annahmen und die Zahnrad-Labels im Browser geprüft; keine Konsolenfehler. Die Zahnrad-Labels lauten jetzt: IT & Daten · Website · Handwerker-Software · bexio · Sie und Ihr Team.

---

## Teil Q – Prüfnetz und das externe Hero-Bild (31.07.2026)

### Q1 – `_pruef.py`: alle Invarianten in einem Lauf

Der Anlass war Selbstkritik: in dieser Session habe ich zweimal etwas kaputt gemacht, das ich vorher selbst gebaut hatte (der Hero-Chip verlinkte in ein zugeklapptes `<details>`; die Symmetrie-Messung lief in die Einflug-Animation der Zahnräder). Beides hätte ein Skript gefunden. Es prüft in einem Durchgang:

**Text:** `a2` nirgends in `AREAS` · je Schritt genau ein gelber Kasten pro leuchtendem Zahnrad · kein `KI:` · `IT:` mit «richten wir ein» · `Website:` mit «bauen wir» · max. 6 Wörter · keine Preise · 2–3 Sätze je Aufklapp-Text · ein Kategorie-E-Satz · fünf verbotene Begriffe über alle Vorlagen · Bundle im Takt mit `arbeit.html` · Datum an allen fünf Stellen gleich · Anker-Links aus iframes mit `target="_parent"`.

**Browser:** keine 404 und keine Konsolenfehler · nichts Wesentliches unter 12 px, Zahl der Schriftstufen · keine toten Anker · Einwand-Chips haben ein Panel und genau eines ist offen · Hero-Chip klappt das Team auf · Symmetrie im Vergleichsbild **mit 6.5 s Wartezeit** · bei 390 px ragt nichts heraus · iframe-Höhe über `_test_hoehe.py`.

**Gegengeprüft, damit das Grün etwas bedeutet:** dieselbe Logik auf `auftragsfluss.html.bak_vor_H` findet dort **22 Verstösse** (a2 in AREAS, drei `KI:`-Tags, sechs Schritte mit 4–6 Sätzen, überall Kästen ≠ Zahnräder). Der Prüfer schlägt also an.

Aktueller Stand: **0 Fehler, 0 Hinweise.**

### Q2 – Das Hero-Bild kam live von remastoren.ch

Der 404 in der Konsole, den ich die ganze Session gesehen und nie verfolgt habe: **`assets/hero.jpg` existierte nicht.** Das prominenteste Bild der Seite lief deshalb über den `onerror`-Fallback direkt von **seinem** Server. Drei Folgen: ohne Internet bleibt der Hero leer · **jeder Aufruf der Demo erzeugt einen Zugriff in seinem Webserver-Log**, er könnte die Demo also bemerken, bevor wir sie schicken · tauscht er das Bild aus, bricht unser Hero.

Bild lokal abgelegt und verlustarm neu gespeichert: **429 KB → 67 KB** (Qualität 82, progressiv, Grösse unverändert 721 × 817). Geprüft: **keine Requests mehr an remastoren.ch**, Platzhalter inaktiv, Bild lädt aus `assets/`.

Der `data-fb`-Fallback des Logos bleibt bestehen — `assets/logo.png` ist vorhanden, der Fallback greift nur, wenn die Datei fehlt.

### Nachtrag zu P3 (31.07.2026)

Der Titel «Wie ein Kundenauftrag **bei Ihnen läuft** — und wie er laufen könnte» behauptete Wissen über seinen heutigen Ablauf, das wir laut Annahmen-Kasten ausdrücklich nicht haben. Korrigiert zu:

> **Wie ein Kundenauftrag oft läuft — und wie er bei Ihnen laufen könnte.**

Die erste Hälfte ist jetzt generisch (wörtlich die Spaltenüberschrift des Ablaufs, «Wie es oft läuft»), das «bei Ihnen» steht im Konjunktiv der zweiten Hälfte. Der Vergleich bleibt im Titel, die unbelegte Behauptung ist weg.

---

## Teil R – Szenariofest: bexio raus, Schicht 4 offen (31.07.2026)

**Quelle:** `bexio_Notwendigkeit_Szenarienanalyse_8Mann_Betrieb.html` (interne Strategiedoku, 535 Zeilen).
**Sicherungen:** `auftragsfluss.html.bak_vor_szenarien`, `zahnrad-animation.html.bak_vor_szenarien`, `REMA_Storen_Demo_v3.html.bak_vor_szenarien`

### Der Widerspruch, der alles andere überlagerte

Kapitel 8 der Analyse: «Die Demo zeigt **nicht** … keine Produktnamen … keine Buchhaltung, keine MWST, keinen Lohn … **nichts, was von der Treuhänder-Antwort abhängt.**» Die Demo tat genau das Gegenteil: **bexio an 15+ Stellen** und der Schlussabsatz **entschied Schicht 4** («Offerte, Rapport und Rechnung in der Handwerker-Software, Buchhaltung und Lohn in bexio»).

Der eigentliche Fehler war die **Asymmetrie**: noovi war seit Punkt 52 konsequent als «Handwerker-Software» anonymisiert — bexio nicht. Ein Produkt versteckt, das andere fünfzehnmal genannt.

| Nr. | Änderung |
|---|---|
| R1 | **Das vierte Zahnrad heisst «Treuhand».** Kein Produktname, und die Analyse liefert das Bild selbst: «das Treuhänder-Zahnrad, das wir nicht besitzen». Gelöst wie in H1 — **getauscht statt gelöscht**, damit die Geometrie unberührt bleibt: `abuch` behält Pfad und Position. Label, `aria-label` und `GEAR_PARTS` nachgezogen |
| R2 | **`AREAS` 3 und 4 verlieren `'abuch'`** — die Treuhand leuchtet nur noch in Schritt 8, wo die Übergabe stattfindet. Damit ist die Finanzschicht **eine** Stelle im Ablauf statt drei |
| R3 | **Vier bexio-Kästen → einer:** `bexio: Produktkatalog wird synchronisiert` (S3) und `bexio: Kreditor & Zahllauf` (S4) entfallen, `bexio: Zahlungsabgleich, Lohn & Buchhaltung` (S8) → **`Treuhand: bekommt alles, was sie braucht`** — wörtlich die Formel aus Station ⑦ der Analyse. **14 statt 16 Kästen** |
| R4 | **Der Schlussabsatz entscheidet nichts mehr:** «Jede Sache liegt in **genau einem System**: Anfrage, Offerte, Rapport und Rechnung in der Handwerker-Software — und Ihre Treuhänderin bekommt daraus, was sie braucht, **in welchem Programm sie auch arbeitet.**» Damit ist die Demo in allen drei Szenarien (A, B, C) richtig — laut Analyse genau ihr Zweck |
| R5 | **MWST, Lohn, Kreditoren, Verbuchung sind weg.** DON'T-Liste der Analyse: «bexio als Buchhaltungssoftware verkaufen — das Wort löst sofort Abwehr aus» |
| R6 | **Der Produktkatalog kommt nicht mehr aus bexio.** Die Analyse belegt, dass die Handwerker-Software es selbst kann: Leistungsverzeichnis mit SIA-Import und **IDS-Schnittstelle für Material-Import** (Grosshandels-Standard). S3 sagt das jetzt so |
| R7 | **Die Annahme «Ihre Buchhaltung läuft in bexio» ist gestrichen** — sie war die einzige, die von der Treuhänder-Antwort abhing. Stattdessen im Schluss des Annahmen-Kastens: «In welchem Programm Ihre Treuhänderin bucht, müssen wir dafür nicht wissen — der Ablauf oben bleibt derselbe.» Aus der Unwissenheit wird ein Argument |
| R8 | **Quellen-Tracking in S2** — die Analyse nennt es «das stärkste Verlängerungs- und Upsell-Argument, das wir haben»: nicht nur wie viele Anfragen gewonnen werden, sondern **über welchen Weg die guten Aufträge kommen** |
| R9 | **Zwei IT-Details in S7, die unsere Kompetenz belegen:** Ablage **mit Versionen**, und die Verbindung läuft **über ein Firmenkonto, damit sie nicht stillsteht, wenn jemand das Team verlässt.** Beides steht in der Analyse als ausdrückliche Empfehlung — «zwei Einstellungen machen es revisionsfest, und beide sind unsere Aufgabe» |
| R10 | **Die Mahn-Falle benannt**, aber am richtigen Ort: nicht im Ablauf (kein Platz bei 2–3 Sätzen), sondern im Einwand «Wie viel Arbeit ist das für mich?» — «zehn Minuten pro Woche für die Zahlungseingänge — sonst mahnt das System bezahlte Rechnungen» |
| R11 | **Zahnrad-Überschrift** «Welches System trägt das» → **«Wo das läuft»**. Die Treuhand ist kein System; die alte Formulierung wurde durch R1 falsch |

### Aus der Randnotiz zur Phasenfolge

Die korrigierte Reihenfolge (drei Fragen → noovi operativ → IT-Fundament → Finanzschicht → Front → Ausbau) betrifft das Projektvorgehen, nicht die Demo. **Eine Folge gehört aber auf die Seite:** «Sie starten mit einem Bereich, der Rest kommt in Stufen» lud dazu ein, nach der Software aufzuhören — genau die Falle aus der Notiz («dann haben wir uns zum Software-Einführer gemacht»). Neu:

> Angefangen wird dort, wo es am meisten weh tut — **der Unterbau aus Geräten, Ablage und Telefon kommt im gleichen Angebot**, nicht irgendwann später.

«Unterbau» ist aus der Notiz übernommen («Damit es nicht an einem Handy hängt, kommt jetzt der Unterbau») — ein Wort von der Baustelle.

**Nebenbefund:** die Bereichsnummerierung im Werkzeugkasten stimmt mit der neuen Reihenfolge bereits überein — Bereich 1 ist «Handwerker-Software & Prozesse», Bereich 2 «IT, Geräte & Daten». Nichts zu ändern.

### Die Doktrin ist jetzt maschinell geprüft

`_pruef.py` kennt das neue Präfix (`Treuhand` → `abuch`), verbietet Treuhand-Tags mit «bauen wir»/«richten wir ein» (die Treuhand ist nicht unsere Leistung) und prüft **13 verbotene Begriffe** statt fünf: dazu **bexio, noovi, Sage, Abacus, MWST, Kreditor, Buchhaltung, Lohn**. Ein Rückfall in die Produktnennung schlägt ab jetzt sofort an.

Der Prüfer hat den Umbau übrigens selbst gefunden: nach dem Tag-Wechsel meldete er «Schritt 8: Kästen ['?', 'a3'] != Zahnräder ['a3', 'abuch']», weil er `Treuhand:` noch nicht kannte.

### Offen, weil es eine Entscheidung des Auftraggebers ist

**KI-Telefonie.** Die Szenarienanalyse führt sie als festen Teil von Schicht 2 und als Station ② der Demo. Das Auftragsfluss-Feedback (Punkt 5) liess sie an drei Stellen **komplett entfernen**. Aktuell ist sie draussen, Teil H hat stattdessen die klassische Telefonie eingebaut (Warteschleife, Ansage, Geschäftsnummern). Zwei interne Papiere widersprechen sich — das ist keine Sache, die ein Skript oder ich entscheiden kann.

**Ebenfalls offen aus Kapitel 8:** Station ① «So findet dich der Kunde» — seine Website mit seinem Logo. Die Demo behauptet den Bereich Website in Tags, zeigt ihn aber nirgends.

### Prüflauf nach Teil R

**0 Fehler, 0 Hinweise.** 14 Kästen, deckungsgleich mit den Zahnrädern · keiner der 13 verbotenen Begriffe in allen vier Vorlagen · **bexio 0×** im gesamten kundensichtbaren Text · Höhe −1 px · Symmetrie 51/38 px · keine Konsolenfehler.

---

## Teil S – Review 6.1 umgesetzt (01.08.2026)

**Quelle:** `Demo_Review_REMA_Storen_6.1.docx`, Kapitel 12 (A1–A15, B1–B5, C1–C8).
**Sicherungen:** `auftragsfluss.html.bak_vor_review61`, `REMA_Storen_Demo_v3.html.bak_vor_review61`

### Sachkorrekturen — an fuenf Stellen stand Falsches oder zu Wenig

| Nr. | Vorher | Jetzt |
|---|---|---|
| A2 | «Keine Software merkt von selbst, dass ein Lieferant zu spät ist» | **sachlich falsch.** Belegt: jede Bestellposition trägt ein geplantes Lieferdatum, Überfälligkeit löst eine E-Mail ans Büro aus. Neu: «Wird es überschritten, meldet sich das System bei Ihrem Büro von selbst — und Ihr Büro ruft an, bevor der Kunde anruft. So erfahren Sie es zuerst.» |
| A10 | «an den Serviceeinsatz erinnert die Software nicht» | **ebenfalls falsch** — es gibt Serien-Termine und eine Abo-Erinnerung, die wöchentlich nachfasst. Das korrigiert auch meinen eigenen Befund aus Teil H, der auf zu schmaler Doku-Basis stand. Neu: «Das System erinnert Ihr Büro, bis der Termin gemacht ist — und die Abo-Rechnung geht erst raus, wenn der Monteur die Wartung im Rapport bestätigt hat.» |
| A11 | «Diktieren liefert Text, keine gefüllten Felder» | **wir untertreiben:** die Spracheingabe füllt Zeit-, Material- und Notizfelder strukturiert; nur Angebotspositionen sind Vorschläge. Aufgeteilt: die Diktat-Stärke steht jetzt beim Rapport, die Grenze bei der Offerte |
| A1 | «Material kommt über die Schnittstelle des Grosshandels» | IDS ist Sanitär- und Elektro-Grosshandel, REMA bestellt bei Herstellern — der Satz widersprach der Annahmen-Box zwei Abschnitte weiter oben |
| A9 | «Das Aufmass erfassen Sie am Objekt — diktiert statt getippt» | das Aufmass-Modul ist Beta und läuft nur am Computer. Neu ohne Ortsangabe: «Die Masse nehmen Sie auf und erfassen sie einmal» |
| A12 | «Ablage mit Versionen» | die Versionierung kommt von der Microsoft-Firmenablage, nicht von der Handwerker-Software — also **unsere Leistung**: «jede Änderung bleibt nachvollziehbar; die richten wir ein» |
| A5 | «nichts existiert nur in einem Postfach oder auf einem Laptop» | versprach ein Archiv, das es nicht gibt. Neu die Zweiteilung: Baustellen-Unterlagen in die Firmenablage, kaufmännische Belege bleiben, wo sie entstehen |

### Tonlage — dieselbe Ehrlichkeit, aber als Rollenverteilung

| Nr. | Änderung |
|---|---|
| A3 | Die WhatsApp-Regel war ein **Verbot für seine Leute**. Jetzt ein Vorteil für ihn: «Kundennachrichten laufen über den Betrieb … die Kundenbeziehung bleibt beim Betrieb, auch wenn ein Monteur einmal wechselt» |
| A4 | «Den Rapport diktiert **oder fotografiert** der Monteur» suggerierte, dass es weiter einen Zettel gibt — genau davon wollen wir ihn wegholen |
| A6 | Der Kanal-Satz versprach eine zweiseitige WhatsApp-Anbindung, die ein eigenes Projekt ist. Neu: «Die ersten Fragen klärt ein Assistent, dann übernimmt Ihr Team» |
| A7 | «nennt einen Preisrahmen» → «nennt eine **unverbindliche Grössenordnung**» |
| A15 | «Treuhand: bekommt alles, was sie braucht» klang nach Automatik. Aktiv: «**mit Ihrer Treuhänderin klären wir, was sie braucht und in welcher Form** — Sie sitzen nicht mehr dazwischen». Tag → `Treuhand: Übergabe klären wir` |
| A14 | Beta-Hinweis im Annahmen-Kasten: «Zwei der gezeigten Bausteine sind beim Hersteller gerade neu; wir setzen sie erst ein, wenn sie bei Ihnen sicher laufen» |

### Neue Inhalte

| Nr. | Was |
|---|---|
| **B1** | **Zehnte Station «Die Verwaltung fragt nach»** — die grösste inhaltliche Lücke. Rechnungsempfänger ≠ Leistungsort, Objektadresse für den Monteur, Objekthistorie, Kundenzugang für die grössten Verwaltungen. Nicht versprochen: Sammelrechnung und Reaktionszeit-Nachweis, beide laut Review nicht dokumentiert. Tag `Software: Objektadresse & Kundenzugang`, `AREAS[10] = ['a3']`. **Der Ablauf hat jetzt zehn Schritte**; `measure()`, `renderVals()`, `_test_hoehe.py` und `_pruef.py` sind mitgezogen |
| **B2** | **Sturmszenario** — nicht als eigene Station, sondern in Schritt 2. Linke Spalte: «Nach dem Sturm klingelt es dreissig Mal, und Sie stehen auf einem Dach» |
| **B4** | **Anlagen-Verzeichnis** in Schritt 9: Typ, Motor, Einbaujahr, Datenblatt am Objekt |
| **B5** | **Eingangsrechnung per Weiterleitung** in Schritt 4: ausgelesen, zugeordnet, Doppelte erkannt |
| **B3** | **Treuhand-Zahnrad als extern gekennzeichnet:** graue Fläche, gestrichelter Rand, zweite Zeile «extern» |
| **C6** | **Vierter IT-Moment** in Schritt 6: «Geht ein Handy kaputt oder verloren, läuft am selben Tag ein Ersatzgerät.» Dafür `IT: Geräte & Ersatz richten wir ein`, `AREAS[6]` um `'a1'` erweitert |

### Elternseite

| Nr. | Änderung |
|---|---|
| C2 | **Die Einwände sind offen** — sie waren hinter «Häufige Fragen ansehen» versteckt, dem Ort, an dem Vertrauen entsteht. Das `<details>` im Team-Block bleibt zu |
| C3 | CTA auf **eine** Option; der `mailto`-Knopf ist ein **WhatsApp-Link** (`wa.me`), weil mailto auf Handys ohne Mailkonto ins Leere läuft |
| C4 | Reihenfolge explizit: «Angefangen wird beim Rapport … der Unterbau kommt direkt danach, **und betrieben wird er von uns, nicht von Ihnen**» |
| C5 | Anker von aussen: «läuft bei über tausend Schweizer KMU» |
| C8 | **Vierte Sorglos-Kachel:** «Wir reden mit den anderen. Mit Ihrer Treuhänderin, dem Software-Hersteller, dem Telefonanbieter, Ihren Lieferanten. Sie hören nur das Ergebnis.» Dazu im Einwand «Hab schon Software»: «und wir sprechen mit ihm, damit Sie es nicht müssen» |

### Bewusst nicht umgesetzt

- **C1 (drei statt vier Bereiche)** — im Review steht ausdrücklich «erst nach Freigabe umsetzen, weil sie auch den Werkzeugkasten betrifft». Die drei verschiedenen Vierer-Sets bleiben vorerst.
- **C7 (Name «Herr Redza»)** — nicht automatisch verifizierbar, gehört vor den Versand.
- **A8** — durch A13 erledigt: die Online-Zusage über einen Kundenlink ist belegt, der Satz bleibt.

### Offen, weil es eine Entscheidung ist

Das Sturmszenario beschreibt einen **Assistenten, der Anrufe annimmt**. Punkt 5 des ursprünglichen Feedbacks hatte die KI-Telefonie an drei Stellen entfernt, Teil H hat stattdessen die klassische Telefonie eingebaut. Review 6.1 und die Szenarienanalyse setzen sie dagegen voraus. Umgesetzt ist die Review-Fassung — wird die KI-Telefonie nicht angeboten, muss der Satz in Schritt 2 wieder weg.

### Prüflauf

**0 Fehler, 3 Hinweise** (Schritt 2, 8 und 9 mit 463–472 Zeichen knapp über dem Richtwert 460, inhaltlich gewollt). Zehn Stationen, 17 gelbe Kästen deckungsgleich mit den Zahnrädern, keiner der 13 verbotenen Begriffe, Höhe −2 px, keine Konsolenfehler, mobil kein Überstand.

---

## Teil T – v4: die Fassung für den Handwerker (01.08.2026)

**Auftrag:** die Demo zielgruppengerechter machen — der Ablauf ist für einen Handwerker zu detailliert.

### Der konzeptionelle Befund

Mein erster Reflex war, den Ablauf hinter einen Klick zu legen. Das war falsch. **Der Ablauf ist nicht zu detailliert — er stand an der falschen Stelle.** Er beantwortet «welches System trägt welchen Schritt», und das ist unsere Frage. Seine Frage ist «was fällt für mich weg». Die Demo zwang ihn, sich durch den Beweis zu arbeiten, um die Antwort zu finden.

**Die Lösung ist Reihenfolge, nicht Löschen:** Antwort zuerst, Beweis danach.

### Was v4 anders macht

**Vier Entlastungs-Karten** direkt nach der Betriebs-Karte, vor allem anderen:

| Chip | Titel | Was bleibt |
|---|---|---|
| Handwerker-Software | Die App nimmt Ihnen die Zettel ab. | das Bestellmass rechnet Ihr Fachmann |
| IT, Geräte & Telefon | Um die Technik kümmern wir uns. | einmal richtig aufräumen dauert ein paar Wochen |
| Website | Die Website arbeitet, wenn Sie auf dem Dach sind. | am Telefon bleibt ein Mensch |
| Treuhand · extern | Mit Ihrer Treuhänderin reden wir. | was und wie sie bucht, entscheidet sie |

Jede Karte: Bereich als Chip, Titel als Entlastung, zwei Sätze, dann **«Was bleibt:»** mit einer ehrlichen Grenze — dieselben Grenzen wie im Ablauf, nur in seiner Sprache. Die Treuhand-Karte ist grau abgesetzt wie ihr Zahnrad.

**Der Zusammenhang, der es trägt:** es sind dieselben vier wie im Zahnrad um sein Team. Bild → was es für Sie heisst → an einem Auftrag gezeigt. Drei Ebenen, eine Aussage.

**Der Ablauf bleibt vollständig sichtbar**, bekommt aber eine Einleitung, die ihn als Beleg einordnet: «Und an einem einzelnen Auftrag? Von der Anfrage bis zum Geld. Zehn Stationen … tippen Sie an, was Sie interessiert — den Rest können Sie überspringen.»

**Gekürzt in v4:** Sorglos-Kacheln vier → zwei (zwei sind in den Karten aufgegangen) · Annahmen-Kasten auf zwei Sätze · GU-Erklärung auf zwei Sätze.

### Messung

| | v3 | v4 |
|---|---|---|
| sichtbarer Text | 4'931 Zeichen | 5'535 |
| Botschaft steht ab | im Ablauf verteilt | **1'294 px** (zweiter Bildschirm) |
| Seitenhöhe | 8'241 px | 8'871 px |

v4 ist **länger**, nicht kürzer — und trotzdem einfacher. Das ist der Punkt: nicht die Textmenge entscheidet, sondern wann die Botschaft steht. Nach 1'294 px kann er aufhören zu lesen und weiss alles Wesentliche.

Erster Aufbau hatte die Karten hinter dem Zahnrad-Abschnitt (2'376 px, dritter Bildschirm) — nach der Messung umgestellt.

### Betrieb

Beide Fassungen nutzen **dieselben drei iframes**. Inhalt wird einmal gepflegt; nur die Elternseite unterscheidet sich. Dokumentiert in `Uebergabe.md`, Abschnitt 9b.

---

## Teil U – Zehn Leser, vier Lücken (01.08.2026)

Die Demo aus zehn Perspektiven gelesen: Chef, Büroleiterin, Nachfolger, Monteur, ein zweimal Gebrannter, ein Rechner mit bestehender Software, ein wachsender Betrieb, ein Einzelmeister, ein Preisbewusster, ein Handy-Leser. Vier Dinge nannten mehrere unabhängig voneinander.

**Sicherung:** `REMA_Storen_Demo_v4.html.bak_vor_personas`

| Lücke | Wer sie nannte | Umgesetzt in v4 |
|---|---|---|
| **Der Preis fehlt** — die Frage entsteht bei den vier Karten, beantwortet wird sie 6'000 px später | Chef, Rechner, Preisbewusster, Handy-Leser | Zeile unter den Karten: «Was das kostet, hängt davon ab, wie viel bei Ihnen schon läuft. **In zwanzig Minuten rechnen wir es mit Ihnen durch** — und wenn es sich nicht rechnet, sagen wir es Ihnen.» Keine Zahl, aber die Frage ist beantwortet, wo sie entsteht |
| **Kein Anruf-Knopf in der Mitte** — nach den Karten ist er überzeugt, der CTA kam ganz unten | Handy-Leser | Zweiter Anruf-Knopf direkt darunter. Auf dem Handy jetzt bei 5'178 px statt erst bei 9'433 |
| **Das Team draussen wird nicht angesprochen** — der stärkste Satz für den Monteur («bei Regen, mit Handschuhen, auf dem Gerüst wird nichts getippt») steckte in einem Einwand, den er nie öffnet | Monteur, Nachfolger | Eigener Block **«Und Ihre Leute?»** nach den Karten, drei Sätze, mit «was Ihr Team nach vier Wochen nicht nutzt, lassen wir weg» |
| **Der Ausstieg fehlte** — bei der Kürzung in Teil K rausgeflogen, ausgerechnet der Satz, den ein Gebrannter sucht | der Gebrannte | «und steigen Sie aus, bekommen Sie alles exportiert» wieder im Einwand «Wie viel Arbeit ist das für mich?» |

### Nicht umgesetzt, weil es Material braucht

**Die Software wird nie gezeigt.** Drei der zehn nannten es: die Demo beschreibt eine App über die ganze Seite und zeigt sie kein einziges Mal. Ein Bildschirmfoto vom Rapport auf dem Handy wäre der stärkste Beweis der Seite — und der einzige, der ohne Text funktioniert. Braucht einen Screenshot aus dem Testaccount.

### Nicht umgesetzt, weil es eine Freigabe braucht

**«Vier Sachen müssen laufen. Alle vier machen wir»** gegen ein Zahnrad, das ausdrücklich extern ist — der Rechner sieht diesen Widerspruch in zwei Sekunden. Das ist Punkt C1 aus Review 6.1, dort steht «erst nach Freigabe umsetzen, weil sie auch den Werkzeugkasten betrifft».

### Weitere Befunde, festgehalten statt umgesetzt

- **Die Büroleiterin wird nirgends angesprochen**, obwohl sie am meisten umstellt. Die Demo redet durchgehend mit dem Chef; sie kommt nur als Objekt vor («wer bei Ihnen das Büro macht»).
- **«Über tausend Schweizer KMU»** liest ein Gebrannter als Prospektzahl. Ein Betrieb aus der Region mit Namen wäre stärker als eine grosse Zahl.
- **Der Einzelmeister mit zwei Leuten** fühlt sich als falsche Grösse (Plantafel, Disponent, «acht Stunden kalkuliert»), **der Betrieb mit fünfzehn** vermisst Lager, Fahrzeuge und Subunternehmer. Beides ist die Folge einer bewussten Fokussierung auf acht Leute — es sollte nur eine Entscheidung bleiben, kein Zufall.
- **Die Treuhänderin liest mit**, wenn er ihr den Link schickt. Für sie ist «was und wie sie bucht, entscheidet sie» respektvoll — «Wir reden mit den anderen» kann sie aber auch als «über meinen Kopf hinweg» lesen.

### Stand v4

7'495 px (Desktop), 9'944 px (Handy), 6'643 Zeichen sichtbar, zwei Anruf-Knöpfe, kein Überstand bei 390 px, keine Konsolenfehler.

---

## Teil V – Prüfnetz, Ladegewicht, Werkzeugkasten (02.08.2026)

### V1 – Der Prüfer deckt jetzt beide Fassungen ab

`_pruef.py` prüfte im Browser nur v3 — ausgerechnet nicht die Fassung, die verschickt wird. Beim ersten Lauf über v4 fand er sofort **vier Chips mit 11.5 px**, unter der eigenen 12-px-Regel; sie waren mit den Entlastungs-Karten neu dazugekommen. Behoben (12.6 px).

**Technisch:** nach dem ersten Browser stirbt der Playwright-Treiber, wenn drei iframes offen waren — ein zweiter `launch()` im selben Prozess scheitert. Jede Seite läuft deshalb in einem **eigenen Unterprozess** (`_pruef.py --seite <datei>`). Ein Absturz reisst damit auch nicht mehr den ganzen Lauf mit.

⚠️ Der Gesamtlauf dauert jetzt **über vier Minuten**. Für schnelle Runden `--text` nehmen; die Browser-Prüfungen einzeln aufrufen, wenn eine Zeitgrenze im Weg ist.

### V2 – Keine Anfrage mehr nach draussen

Beide Fassungen hingen an `fonts.googleapis.com` und `fonts.gstatic.com`. Ohne Internet fiel das Layout auf Systemschrift zurück, und jeder Aufruf meldete die IP des Betrachters an Google — bei einer Vorschau für einen Schweizer Betrieb unnötig.

Übernommen wurden die **lateinischen Schnitte**, 16 von 39 `@font-face`-Blöcken, vier Dateien mit zusammen **163 KB**, eingebettet als `<style>` mit relativen Pfaden. Gemessen: **externe Hosts: KEINE**, Typografie unverändert. Details in `Uebergabe.md`, Abschnitt 9c.

### V3 – Der Werkzeugkasten: 3.49 MB → 0.45 MB

Die Datei bestand praktisch aus **einem einzigen PNG**: 3'442 KB base64 im Bundle-Manifest, 1376 × 768, ein Foto. Als JPEG (Qualität 82, progressiv) sind es **244 KB**. Der Alphakanal war durchgehend 255, es ging nichts verloren; das Bild rendert unverändert.

Der Typ steht im Manifest (`"mime":"image/png"` → `"image/jpeg"`) und muss beim Austausch mitgeändert werden — der Bundler baut die Data-URL daraus. Sicherung: `werkzeugkasten.html.bak_vor_bild`.

### V4 – Die drei nie geprüften Bereiche

Bereich 1, 2 und 4 waren nie gegen den Ablauf gelesen worden. Ergebnis: inhaltlich stimmig — «Ersatzgerät läuft am selben Tag» und «Pläne, Fotos und Masse auf der Baustelle» decken sich mit Schritt 6 und 7, «Preise und Positionen sind hinterlegt» mit Schritt 3. Zwei unbelegte Versprechen sind aber geblieben und jetzt korrigiert:

| vorher | jetzt | warum |
|---|---|---|
| «**Offerte in 10 Minuten**» | «Offerte ohne Abtippen» | die einzige Zeitzusage im ganzen Paket, nirgends belegt — und die Demo macht sonst bewusst keine |
| «Kunden finden Sie: **bei Google weit oben**» | «Wer in Ihrer Region nach Storen sucht, landet bei Ihnen — nicht bei drei anderen zuerst» | eine Google-Platzierung kann niemand zusagen; der Nutzen bleibt, das Versprechen wird haltbar |

### V5 – `Fragen_Democall.md`

Vierzehn Fragen in der Reihenfolge des Ablaufs, je Frage **was in der Demo kippt**, wenn die Antwort anders lautet. Dazu die vier Annahmen, die auf der Seite stehen, die drei Einstiegsfragen aus der Szenarienanalyse und die zwei Entscheidungen, die intern fallen müssen (KI-Telefonie, «alle vier machen wir»).

### V6 – Git vorbereitet, nicht ausgeführt

`.gitignore` schliesst `.bak*`, `_archiv/`, `arbeit*.html` und Prüf-Screenshots aus. Damit nähme Git **2.6 MB statt 64 MB** auf, 22 Dateien. **Nicht committet** — Regel des Projekts. Vor einem Commit zu klären: eine **stale `index.lock`** im Repo (abgebrochener Git-Prozess) und ob `Demo_Review_REMA_Storen_6.1.docx` als internes Dokument mitkommen soll.

### Stand

Text 0 Fehler / 3 Hinweise · v3 und v4 im Browser ohne Befund · Höhe −2 px · Ladegewicht auf dem Handy (ganz durchgescrollt) v3 2.9 MB, v4 2.3 MB — vor der Bildkomprimierung wären es rund 3 MB mehr gewesen.

---

## Alle 61 Punkte

### Teil A – Das Grundproblem

| Nr. | Status | Was geändert wurde |
|---|---|---|
| 1 | erledigt | Tag-↔-Text-Widersprüche in Schritt 1, 2 und 9 beseitigt; alle 9 Aufklapp-Texte gegen ihre Tags gelesen |
| 2 | erledigt | Fünf-Kategorien-Logik durchgezogen: A (`Software:`/`bexio:`), B (`IT:`/`Website:` + «richten wir ein»), C (`KI:` + «bauen wir»), E («prüfen wir im Setup» in Schritt 6 und 7); D nur als benannte Grenze |
| 3 | erledigt | Zahnrad zeigt den Bereich, nicht den Erbauer — Chatbot bleibt Web+KI obwohl Eigenbau |
| 4 | erledigt | Meisterwerk-Rest in Schritt 4 entfernt; Volltextsuche = 0 Treffer |

### Teil B – Etappe 1

| Nr. | Status | Was geändert wurde |
|---|---|---|
| 5 | erledigt | KI-Telefonie an allen drei Stellen entfernt (Tag, Satz Schritt 1, Erwähnung Schritt 2); «Telefonie» = 0 |
| 6 | erledigt | Zahnrad 1 unverändert `['a4','a3']`, Tag → `Web + KI: Chatbot bauen wir` |
| 7 | erledigt | «Am Telefon bleibt ein Mensch.» fett in Schritt 1, mit Begründung |
| 8 | erledigt | Schritt 1 bleibt Web+KI, alle IT-Tags sitzen in Schritt 2 |
| 9 | erledigt | «auf der Website oder direkt in WhatsApp»; Preis «ab CHF 99.-/Mt.» entfernt |
| 10 | erledigt | Schritt 1 endet mit «kommt strukturiert bei Ihnen an statt in einer Chat-Gruppe»; Auftrags-Entstehung in Schritt 2 |
| 11 | erledigt | vier Tags: 2× `IT: … richten wir ein`, `KI: Anfrage wird Auftrag — bauen wir`, `Software: Auftrag mit Foto, Mass, Termin` |
| 12 | erledigt | `AREAS[2]` → `['a1','a3','a2']`, im Browser verifiziert |
| 13 | erledigt | «dieselbe Nummer wie in Schritt 1, jetzt ohne Bot: ab hier übernimmt ein Mensch» |
| 14 | erledigt | Konjunktiv entfernt, Terminbuchung klar zugesagt + `IT:`-Tag |
| 15 | erledigt | Kundenbereich in Schritt 6: «Was Sie freigeben, sieht der Kunde in seinem Bereich der App» |
| 16 | erledigt | Referenzmuster auf Schritt 1, 2, 8 und 9 übertragen — ehrlicher Satz fett, Tag deckungsgleich |
| 17 | erledigt | `AREAS[3]` → `['a2','a3','abuch']`; «Das Aufmass erfassen Sie am Objekt in der Handwerker-Software» |
| 18 | erledigt | getrennte Tags `Software: Diktat wird Text` und `KI: Diktat wird Position — bauen wir` |
| 19 | erledigt | «Produktkatalog, der in bexio gepflegt wird — Griesser- und Somfy-Kataloge bringt keine Software mit» |
| 20 | erledigt | **ein empfohlener Weg festgelegt:** Offerte und Rechnung in der Handwerker-Software, bexio als Buchhaltung. «Es gibt genau eine Rechnungs-Engine» fett; Alternative als ein Satz für den Treuhänder-Fall |
| 21 | erledigt | «Offene Offerten stehen auf einer Liste mit Wiedervorlage; nachfassen tut ein Mensch» |

### Teil C – Etappe 2

| Nr. | Status | Was geändert wurde |
|---|---|---|
| 22 | erledigt | Rollen umgedreht: Bestellung/Verbrauch/Lager in der Handwerker-Software, `bexio: Lieferantenrechnung als Kreditor`; bexio-Bestellwesen-Satz gestrichen. Erstbestellung durch das Büro aus der Offerte, Nachschub-Bedarfsmeldung in Schritt 6 |
| 23 | erledigt | «aus der Offerte» statt «aus der bexio-Offerte» |
| 24 | **teilweise** | Meisterwerk entfernt, umgesetzt als «Auftragsnummer der Handwerker-Software» statt «noovi-Auftragsnummer» — Konflikt mit Punkt 52, siehe oben |
| 25 | erledigt | erledigt sich mit 22: bexios Bestellwesen/Lager wird nicht mehr verkauft |
| 26 | erledigt | «Die Umrechnung vom Aufmass aufs Bestellmass macht Ihr Fachmann» fett + «das leistet keine Software» |
| 27 | erledigt | «Den Aufschlag legen wir einmal fest, sonst rechnet jeder anders» |
| 28 | erledigt | «der Lagerbestand ist eine operative Grösse, nicht das Inventar für den Abschluss» |
| 29 | erledigt | Bestellmass, Griesser/Somfy, Motor und Steuerung, Elektroanschluss als Fremdleistung, Gerüst/Hebebühne ergänzt |
| 30 | erledigt | ehrlicher Absatz erhalten und geschärft, Begründung bleibt |
| 31 | erledigt | Unterschied benannt: lieferantenseitige Statusmeldung gibt es nicht; erinnert wird über die Aufgabe am Auftrag — nach Änderung 3 Kategorie A statt Eigenbau |
| 32 | erledigt | «einmal am Auftrag erfasst — für alle sichtbar, statt im Mailpostfach des Chefs» |
| 33 | erledigt | Route und GPS ganz entfernt, Mundart entfernt, Offline als Kategorie E; zurückgebaut auf Plantafel, Arbeitspläne, Push, Zeit am Auftrag, Fotos, Baustellenchat |
| 34 | erledigt | «Bereits Teil der Handwerker-Software» aus Schritt 6 und 7 entfernt, weil beide Absätze jetzt Kategorie-E-Sätze enthalten |

### Teil D – Etappe 3

| Nr. | Status | Was geändert wurde |
|---|---|---|
| 35 | erledigt | sachlich unverändert erhalten; nur der Marker entfiel wegen Punkt 34 |
| 36 | erledigt | «geht auf Wunsch direkt als PDF an den Kunden» + «Der unterschriebene Rapport ist die Freigabe zur Verrechnung» fett |
| 37 | erledigt | «Dass die Rechnung an die Verwaltung geht, der Mieter aber unterschreibt … prüfen wir im Setup» |
| 38 | erledigt | «revisionssicher, zehn Jahre, an einem festgelegten Ort» |
| 39 | erledigt | Pauschal vs. Regie/Nachtrag erhalten und gestrafft |
| 40 | erledigt | «Aus dem freigegebenen Rapport entsteht die Rechnung automatisch in der Handwerker-Software … bexio bekommt sie als fertigen Beleg und verbucht» + Tag `Software: Rechnung aus dem Rapport` — passt zur Architektur aus Punkt 20 |
| 41 | erledigt | GPS-Zeit ersetzt durch «freigegebene Zeiten»; «GPS» = 0 Treffer |
| 42 | erledigt | «Freigegeben werden die Zeiten einmal pro Woche von Ihnen oder dem Büro; erst danach sind sie verrechenbar» |
| 43 | erledigt | Tag getrennt: `KI: Rapport auslesen — bauen wir` (auf den handgeschriebenen Rapport-Zettel eingeschränkt), Diktat-als-Text als Software-Tag in Schritt 3 und 6, Beleg-Auslesen als Software-Tag in Schritt 4 |
| 44 | erledigt | Status in der Handwerker-Software («bezahlt, offen oder überfällig»), Bankabgleich und förmliches Mahnwesen in bexio, Regel «jede Sache in genau einem System, nie in beiden» fett |
| 45 | erledigt | «Der Lohn läuft aus denselben freigegebenen Zeiten: Stundenzettel abtippen fällt weg» |
| 46 | erledigt | «am Ende sehen Sie pro Baustelle, was sie gebracht hat» + Tag `Software: Nachkalkulation pro Baustelle` |
| 47 | erledigt | Tag → `KI: Wartungserinnerung bauen wir`, `AREAS[9]` → `['a4','a3']`, Text sagt klar, dass Intervalle auf Kundenobjekten fehlen |
| 48 | erledigt | Terminbuchung als Kategorie B mit `IT: Terminbuchung richten wir ein` — einheitlich in Schritt 2 und 9; Wert benannt: «die Buchung landet direkt am Auftrag». Offener Bruch: das IT-Zahnrad leuchtet in Schritt 9 nicht, siehe Warnung oben |
| 49 | erledigt | Mängel ins Abnahmeprotokoll (Schritt 7) mit Nachbesserungsauftrag am Original; Garantiefall in Schritt 9 |
| 50 | erledigt | Objekthistorie als Fliesstext **und** Tag `Software: Objekthistorie am Auftrag`; `AREAS[9]` um `'a2'` erweitert |

### Teil E – Abschluss und Struktur

| Nr. | Status | Was geändert wurde |
|---|---|---|
| 51 | erledigt | Schlussabsatz neu: «Jeder Schritt hat genau ein führendes System: Zeit, Rapport und Material immer in der Handwerker-Software, Buchhaltung, MWST, Lohn und Banking immer in bexio.» |
| 52 | erledigt | Anonymität konsequent durchgehalten — «Handwerker-Software» überall, «noovi» nirgends im Ablauf; der letzte Bruch (Schritt 4) beseitigt. Der Schaden, den 52 befürchtete, ist weg, weil die falschen Zusagen aus 5, 33 und 47 entfernt sind |
| — | erledigt | Spalten-Titel «Was möglich wäre» → «So läuft es bei Ihnen» |

### Teil F – Nachträge

| Nr. | Status | Was geändert wurde |
|---|---|---|
| 53 | erledigt | «der Baustellen-Chat ist rein fürs Team» fett in Schritt 6 + Tag; Abgrenzung in Schritt 2: «WhatsApp ist der Weg vom Kunden zu Ihnen; was das Team intern bespricht, läuft am Auftrag» |
| 54 | erledigt | Kundentransparenz über freigegebene Einträge, nicht über Chat; Plan-Frage als Setup-Punkt in Schritt 6 |
| 55 | erledigt | Diktat an drei Stellen: Schritt 3 (Aufmass), 6 (Rapport), 7 (Bemerkungen und Mängel). Harte Grenze zweimal gesetzt: «liefert Text, keine gefüllten Felder» |
| 56 | erledigt | Kette in Schritt 3: «nimmt der Kunde die Offerte mit einem Klick an und daraus wird direkt der Auftrag» |
| 57 | erledigt | Weg B als Empfehlung ausformuliert, Weg A als ein Satz für den Treuhänder-Fall, geteilte Variante durch «genau eine Rechnungs-Engine» ausgeschlossen; keine eigene Offert-Brücke versprochen |
| 58 | erledigt | Erstbestellung: «Die Storen bestellt Ihr Büro aus der Offerte heraus — von Hand bei Griesser oder Somfy im Lieferantenportal» (Schritt 4). Bedarfsmeldung als Nachschub in Schritt 6, samt Tag `Software: Bedarfsmeldung aus der App` |
| 59 | erledigt | Umrechnung als Fachwissen gekennzeichnet; Gewinn korrekt formuliert als «im eigenen Haus wird nichts mehr abgetippt» |
| 60 | erledigt | Verzug als Büro-Erinnerung: Aufgabe mit Fälligkeitsdatum (A), optionaler Trigger mit Freigabe (C), «Der Kunde erfährt es, weil ein Mensch ihn anruft» |
| 61 | erledigt | `AREAS[5]` auf `['a2']` zurückgebaut, KI-Tag und Eigenbau-Satz entfernt; Erinnerung ist eine Aufgabe mit Fälligkeitsdatum, also Kategorie A |
