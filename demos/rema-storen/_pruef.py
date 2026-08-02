# -*- coding: utf-8 -*-
"""Prueft alle Invarianten der REMA-Demo in einem Lauf.

    "$PY" _pruef.py            # alles
    "$PY" _pruef.py --text     # nur die Textpruefungen, ohne Browser

Voraussetzung fuer die Browser-Pruefungen: Server laeuft auf 127.0.0.1:8090
    "$PY" -m http.server 8090 --bind 127.0.0.1
Rueckgabewert 1, wenn eine Pruefung fehlschlaegt.
"""
import io, os, re, sys, json, subprocess

PARENT = 'REMA_Storen_Demo_v3.html'
BUNDLES = {'auftragsfluss.html': 'Ablauf', 'zahnrad-animation.html': 'Animation',
           'werkzeugkasten.html': 'Werkzeugkasten'}
PARENTS = [PARENT, 'REMA_Storen_Demo_v4.html']   # v4 = die Fassung, die verschickt wird
# Praefix eines gelben Kastens -> Zahnrad. 'Treuhand' ist die Finanzschicht:
# nicht unsere Leistung und kein Produkt, sondern die Uebergabe an einen Dritten.
BEREICH = {'Software': 'a3', 'Treuhand': 'abuch', 'IT': 'a1', 'Website': 'a4'}

fehler, warnungen = [], []


def ok(txt):
    print('  OK    %s' % txt)


def fail(txt):
    print('  FEHLER %s' % txt)
    fehler.append(txt)


def warn(txt):
    print('  hinweis %s' % txt)
    warnungen.append(txt)


def entpacke(fn):
    """Template eines Bundles als Text; bei normalen Dateien den Inhalt."""
    raw = io.open(fn, encoding='utf-8', errors='replace').read()
    m = re.search(r'<script type="__bundler/template">(.*?)</script>', raw, re.S)
    if not m:
        return raw
    return json.loads(m.group(1).strip())


def klartext(s):
    s = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', s, flags=re.S | re.I)
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', s)).replace('&amp;', '&')


# ---------------------------------------------------------------- Text
def pruefe_text():
    print('\n== Ablauf: Tags, Zahnraeder, Textlaenge')
    f = entpacke('auftragsfluss.html')

    m = re.search(r'const AREAS = \{(.*?)\};', f, re.S)
    if not m:
        return fail('AREAS nicht gefunden')
    areas = {}
    for n, lst in re.findall(r"(\d+)\s*:\s*\[([^\]]*)\]", m.group(1)):
        areas[int(n)] = sorted(re.findall(r"'([^']+)'", lst))
    if len(areas) != 10:
        fail('AREAS hat %d statt 10 Schritte' % len(areas))
    if any('a2' in v for v in areas.values()):
        fail("'a2' (die Mitte) kommt in AREAS vor — die Nabe ist kein Bereich")
    else:
        ok("die Mitte ('a2') kommt in keinem Schritt vor")

    tags_total = 0
    for n in sorted(areas):
        blk = re.search(r'id="box%d"(.*?)</div>\s*</div>\s*</div>' % n, f, re.S)
        if not blk:
            fail('Schritt %d nicht gefunden' % n)
            continue
        blk = blk.group(1)
        tags = [t.replace('&amp;', '&') for t in
                re.findall(r'border-radius:999px[^>]*>([^<]+)</span>', blk)]
        tags_total += len(tags)
        keys = sorted(BEREICH.get(t.split(':')[0], '?') for t in tags)
        if keys != areas[n]:
            fail('Schritt %d: Kaesten %s != Zahnraeder %s' % (n, keys, areas[n]))
        if len(keys) != len(set(keys)):
            fail('Schritt %d: zwei Kaesten fuer denselben Bereich' % n)
        for t in tags:
            w = [x for x in t.split() if x not in ('&', '—', '-')]
            if t.startswith('KI:'):
                fail('Schritt %d: KI-Praefix "%s"' % (n, t))
            if t.startswith('IT:') and 'richten wir ein' not in t:
                fail('Schritt %d: IT-Tag ohne "richten wir ein": %s' % (n, t))
            if t.startswith('Website:') and 'bauen wir' not in t:
                fail('Schritt %d: Website-Tag ohne "bauen wir": %s' % (n, t))
            if len(w) > 6:
                fail('Schritt %d: Tag mit %d Woertern: %s' % (n, len(w), t))
            if t.startswith('Treuhand:') and ('bauen wir' in t or 'richten wir ein' in t):
                fail('Schritt %d: Treuhand-Tag verspricht unsere Arbeit: %s' % (n, t))
            if re.search(r'CHF|\bFr\.|\d+\.\-', t):
                fail('Schritt %d: Preis im Tag: %s' % (n, t))
        p = re.search(r'<p style="font-size:\.94rem[^"]*">(.*?)</p>', blk, re.S)
        if p:
            txt = klartext(p.group(1)).strip()
            saetze = len([x for x in re.split(r'(?<=[.?!])\s+', txt) if x.strip()])
            if saetze > 3:
                fail('Schritt %d: %d Saetze (erlaubt 2-3), %d Zeichen' % (n, saetze, len(txt)))
            elif len(txt) > 460:
                warn('Schritt %d: %d Zeichen (Richtwert 460)' % (n, len(txt)))
    ok('%d gelbe Kaesten, Anzahl und Praefixe deckungsgleich mit den Zahnraedern' % tags_total)

    volltext = klartext(f)
    if 'im Setup' not in volltext:
        fail('kein Kategorie-E-Satz ("im Setup") im Ablauf')
    else:
        ok('Kategorie-E-Satz vorhanden')

    print('\n== Doktrin: keine Produktnamen, keine Finanzschicht (Szenarienanalyse Kap. 8)')
    # "Die Demo zeigt nicht: keine Produktnamen · keine Buchhaltung, keine MWST,
    #  keinen Lohn · nichts, was von der Treuhaender-Antwort abhaengt."
    verboten = ['Meisterwerk', 'CHF', 'falls möglich', 'GPS', 'Rechnungs-Engine',
                'bexio', 'noovi', 'Sage', 'Abacus',
                'MWST', 'Kreditor', 'Buchhaltung', 'Lohn']
    for fn in list(BUNDLES) + [PARENT] + (['REMA_Storen_Demo_v4.html'] if os.path.exists('REMA_Storen_Demo_v4.html') else []):
        t = klartext(entpacke(fn))
        for v in verboten:
            if v in t:
                fail('"%s" in %s' % (v, fn))
    ok('keiner der %d verbotenen Begriffe' % len(verboten))

    print('\n== Bundles im Takt mit den Arbeitsdateien')
    for bundle, arbeit in [('auftragsfluss.html', 'arbeit.html')]:
        if os.path.exists(arbeit):
            if entpacke(bundle) != io.open(arbeit, encoding='utf-8').read():
                warn('%s weicht von %s ab — vor dem Bearbeiten neu extrahieren' % (arbeit, bundle))
            else:
                ok('%s == %s' % (arbeit, bundle))

    print('\n== Elternseite: Datum an allen Stellen gleich')
    p = io.open(PARENT, encoding='utf-8').read()
    datum = re.findall(r'(?:August|September|Oktober|November|Dezember|Januar|Februar|März|April|Mai|Juni|Juli) 20\d\d', p)
    if len(set(datum)) == 1 and len(datum) >= 4:
        ok('%d× "%s"' % (len(datum), datum[0]))
    else:
        fail('Datumsangaben: %s' % sorted(set(datum)))

    print('\n== Links aus den iframes zeigen auf die Elternseite')
    for fn in BUNDLES:
        t = entpacke(fn)
        for m2 in re.finditer(r'<a [^>]*href="#[^"]*"[^>]*>', t):
            if 'target="_parent"' not in m2.group(0):
                fail('%s: Anker-Link ohne target="_parent"' % fn)
                break
        else:
            ok('%s: Anker-Links in Ordnung' % fn)


# ---------------------------------------------------------------- Browser
JS = r"""() => {
  const R = {};
  R.klein = [...document.querySelectorAll('body *')]
    .filter(e => e.children.length === 0 && e.textContent.trim().length > 2
                 && getComputedStyle(e).display !== 'none'
                 && parseFloat(getComputedStyle(e).fontSize) < 12)
    .map(e => Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10 + 'px: '
              + e.textContent.trim().slice(0, 30));
  R.groessen = new Set([...document.querySelectorAll('body *')]
    .filter(e => e.children.length === 0 && e.textContent.trim().length > 2)
    .map(e => Math.round(parseFloat(getComputedStyle(e).fontSize)))).size;
  R.tote_anker = [...document.querySelectorAll('a[href^="#"]')]
    .map(a => a.getAttribute('href')).filter(h => h.length > 1 && !document.querySelector(h));
  R.chips = [...document.querySelectorAll('.ochip')].map(c => c.getAttribute('aria-controls'));
  R.chips_ohne_panel = R.chips.filter(id => !document.getElementById(id));
  R.offene_panels = document.querySelectorAll('.obody.on').length;
  R.team_zu = !!document.querySelector('#ueberuns details') && !document.querySelector('#ueberuns details').open;
  return R;
}"""

JS_ROLLEN = r"""() => {
  const R = e => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.right)]; };
  return {bild: R(document.querySelector('.chaos-photo')),
          pfeil: R(document.querySelector('.role-arrow')),
          iframe: R(document.querySelector('.gear-iframe'))};
}"""


def pruefe_browser():
    """Beide Fassungen im Browser pruefen — v4 ist die, die verschickt wird."""
    try:
        import playwright  # noqa: F401
    except ImportError:
        return warn('playwright fehlt — Browser-Pruefungen uebersprungen')
    # Jede Seite in einem eigenen Prozess: nach dem ersten Browser stirbt der
    # Playwright-Treiber (drei iframes, der Werkzeugkasten allein 3.6 MB), und
    # ein zweiter Start scheitert dann. Getrennte Prozesse sind ausserdem
    # robuster — ein Absturz reisst nicht den ganzen Lauf mit.
    for datei in PARENTS:
        if not os.path.exists(datei):
            continue
        lauf = subprocess.run([sys.executable, os.path.abspath(__file__), '--seite', datei],
                              capture_output=True, text=True, encoding='utf-8', errors='replace')
        print((lauf.stdout or '').rstrip())
        if lauf.returncode:
            fehler.append('%s: Browser-Pruefung meldet Fehler' % datei)


def pruefe_seite(b, datei):
    url = 'http://localhost:8090/' + datei
    if True:
        pg = b.new_page(viewport={'width': 1400, 'height': 1000})
        fehlende = []
        pg.on('response', lambda r: fehlende.append('%s %s' % (r.status, r.url)) if r.status >= 400 else None)
        pg.on('requestfailed', lambda r: fehlende.append('FAIL ' + r.url))
        fehlerkonsole = []
        pg.on('console', lambda m: fehlerkonsole.append(m.text) if m.type == 'error' else None)
        try:
            pg.goto(url, wait_until='networkidle', timeout=20000)
        except Exception as e:
            return fail('Seite nicht erreichbar (Server auf 8090 gestartet?): %s' % str(e)[:60])
        pg.add_style_tag(content='.reveal{opacity:1!important}')
        pg.wait_for_timeout(1500)

        print('\n== %s im Browser' % datei)
        if fehlende:
            for x in fehlende:
                fail('Request fehlgeschlagen: %s' % x)
        else:
            ok('kein fehlgeschlagener Request')
        if fehlerkonsole:
            for x in fehlerkonsole:
                fail('Konsolenfehler: %s' % x[:70])
        else:
            ok('keine Konsolenfehler')

        r = pg.evaluate(JS)
        if r['klein']:
            for x in r['klein']:
                if 'Vorschau ·' in x:
                    continue          # Datums-Chip am Kopf, bewusst klein
                fail('Schrift unter 12 px — %s' % x)
        ok('Schriftgroessen: %d Stufen, nichts Wesentliches unter 12 px' % r['groessen'])
        if r['groessen'] > 18:
            warn('%d verschiedene Schriftgroessen (Richtwert bis 18)' % r['groessen'])
        if r['tote_anker']:
            fail('tote Anker: %s' % r['tote_anker'])
        else:
            ok('alle Anker-Links haben ein Ziel')
        if r['chips_ohne_panel']:
            fail('Einwand-Chips ohne Panel: %s' % r['chips_ohne_panel'])
        elif r['offene_panels'] != 1:
            fail('%d offene Einwand-Panels (erwartet 1)' % r['offene_panels'])
        else:
            ok('%d Einwand-Chips, genau eines offen' % len(r['chips']))

        # Hero-Chip muss das Team aufklappen
        if r['team_zu']:
            pg.click('.hcr')
            pg.wait_for_timeout(700)
            if pg.eval_on_selector('#ueberuns details', 'e=>e.open'):
                ok('Hero-Chip klappt den Team-Bereich auf')
            else:
                fail('Hero-Chip fuehrt in ein zugeklapptes Team')

        print('   -- Symmetrie im Vergleichsbild')
        pg.eval_on_selector('.roles', 'e=>e.scrollIntoView()')
        pg.wait_for_timeout(6500)                      # Einflug der Zahnraeder abwarten
        d = pg.evaluate(JS_ROLLEN)
        rahmen = [f for f in pg.frames if 'zahnrad' in (f.url or '')]
        if rahmen:
            g = rahmen[0].evaluate("""()=>{const gs=[...document.querySelectorAll('svg path')]
                .map(p=>p.getBoundingClientRect());
                return Math.round(Math.min(...gs.map(x=>x.left)));}""")
            pm = (d['pfeil'][0] + d['pfeil'][1]) // 2
            links, rechts = pm - d['bild'][1], d['iframe'][0] + g - pm
            if abs(links - rechts) <= 14:
                ok('Pfeil mittig: %d px links, %d px rechts' % (links, rechts))
            else:
                fail('Pfeil nicht mittig: %d px links, %d px rechts' % (links, rechts))

        print('   -- Mobil (390 px)')
        pm2 = b.new_page(viewport={'width': 390, 'height': 900})
        pm2.goto(url, wait_until='networkidle')
        pm2.add_style_tag(content='.reveal{opacity:1!important}')
        pm2.wait_for_timeout(1500)
        JS_UEBER = """()=>{const W=document.documentElement.clientWidth; const o=[];
            // Nur abgeschnittener TEXT zaehlt. Bilder und SVG-Formen duerfen bewusst
            // ueber den Rand laufen (Cover-Zuschnitt des Werkzeugwand-Fotos).
            document.querySelectorAll('body *').forEach(e=>{
              const b=e.getBoundingClientRect();
              const txt=[...e.childNodes].filter(n=>n.nodeType===3 && n.textContent.trim()).length>0;
              if(txt && b.width>0 && b.right > W+2)
                o.push('"'+e.textContent.trim().slice(0,22)+'" bis '+Math.round(b.right)+'px');});
            return o.slice(0,6);}"""
        ueber = pm2.evaluate(JS_UEBER)
        # auch in die iframes schauen - dort sass der Fehler, den die Elternseite nicht zeigt
        pm2.wait_for_timeout(2500)
        for f in pm2.frames:
            if f == pm2.main_frame:
                continue
            try:
                ueber += [f.url.rsplit('/', 1)[-1] + ': ' + x for x in f.evaluate(JS_UEBER)]
            except Exception:
                pass
        if ueber:
            for x in ueber:
                fail('ragt aus dem Bild: %s (Fenster 390)' % x)
        else:
            ok('nichts ragt seitlich heraus')
        # Schliessen darf den Lauf nicht killen: der Treiber verabschiedet sich
        # gelegentlich, nachdem alle Pruefungen schon durch sind.
        for seite in (pm2, pg):
            try:
                seite.close()
            except Exception:
                pass


def pruefe_hoehe():
    print('\n== iframe-Hoehe des Ablaufs')
    if not os.path.exists('_test_hoehe.py'):
        return warn('_test_hoehe.py fehlt')
    out = subprocess.run([sys.executable, '_test_hoehe.py'], capture_output=True, text=True,
                         encoding='utf-8', errors='replace').stdout
    m = re.search(r'groesster Ueberhang:\s*(-?\d+)', out)
    if not m:
        return fail('Hoehentest lieferte kein Ergebnis')
    u = int(m.group(1))
    if u <= 0:
        ok('Ueberhang %d px' % u)
    else:
        fail('Ueberhang %d px — die Elternseite schneidet den Ablauf ab' % u)


if __name__ == '__main__':
    # Unterprozess-Modus: nur eine Seite im Browser pruefen (siehe pruefe_browser)
    if '--seite' in sys.argv:
        _datei = sys.argv[sys.argv.index('--seite') + 1]
        from playwright.sync_api import sync_playwright
        with sync_playwright() as _pw:
            _b = _pw.chromium.launch()
            try:
                pruefe_seite(_b, _datei)
            finally:
                try:
                    _b.close()
                except Exception:
                    pass
        sys.exit(1 if fehler else 0)

    print('Pruefe die REMA-Demo')
    pruefe_text()
    if '--text' not in sys.argv:
        pruefe_browser()
        pruefe_hoehe()
    print('\n%s' % ('-' * 58))
    print('%d Fehler, %d Hinweise' % (len(fehler), len(warnungen)))
    sys.exit(1 if fehler else 0)
