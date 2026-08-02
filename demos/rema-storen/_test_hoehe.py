"""Klappt jeden Schritt auf und prueft, ob die iframe-Hoehe mitwaechst.

Nutzt dieselbe Messlogik wie der Hoehen-Sender in auftragsfluss.html:
Unterkanten werden an Vorfahren geklemmt, die wirklich abschneiden. Zusaetzlich
wird die naive Messung (ohne Klemmen) ausgegeben - die Differenz zeigt, wie viel
zugeklappter Inhalt sonst faelschlich mitgezaehlt wuerde.
"""
import sys
from playwright.sync_api import sync_playwright

url = 'http://localhost:8090/REMA_Storen_Demo_v3.html'
width = int(sys.argv[1]) if len(sys.argv) > 1 else 1400

MEASURE = """() => {
  const CLIP = /^(hidden|auto|scroll|clip)$/;
  function visibleBottom(el){
    let bottom = el.getBoundingClientRect().bottom;
    let p = el.parentElement;
    while (p && p !== document.documentElement){
      const cs = getComputedStyle(p);
      if ((CLIP.test(cs.overflowY) || CLIP.test(cs.overflow)) && p.scrollHeight > p.clientHeight + 1){
        bottom = Math.min(bottom, p.getBoundingClientRect().bottom);
      }
      p = p.parentElement;
    }
    return bottom;
  }
  const sy = window.scrollY || 0;
  let clamped = document.body.scrollHeight, naive = document.body.scrollHeight;
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (!r.height && !r.width) return;
    clamped = Math.max(clamped, visibleBottom(el) + sy);
    naive   = Math.max(naive,   r.bottom + sy);
  });
  return { clamped: Math.round(clamped), naive: Math.round(naive) };
}"""

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': width, 'height': 1000})
    page.goto(url, wait_until='networkidle')
    page.wait_for_timeout(1500)
    page.eval_on_selector('.flow-iframe', 'e => e.scrollIntoView()')
    page.wait_for_timeout(3000)
    fr = [f for f in page.frames if 'auftragsfluss' in (f.url or '')][0]

    worst = [-10 ** 9]

    def state(label):
        h = page.eval_on_selector('.flow-iframe', 'e => e.clientHeight')
        m = fr.evaluate(MEASURE)
        over = m['clamped'] - h
        flag = 'OK' if over <= 4 else 'ABGESCHNITTEN um %d px' % over
        print('%-18s iframe=%-6d sichtbar=%-6d (naiv %-6d) %s'
              % (label, h, m['clamped'], m['naive'], flag))
        worst[0] = max(worst[0], over)

    # Seit dem 01.08.2026 ist Schritt 1 beim Laden offen. Der Startzustand ist
    # also "Schritt 1 offen"; fuer "alle zu" muss man ihn einmal zuklappen.
    offen_beim_start = fr.evaluate(
        '() => document.querySelector(\'button[data-row="1"]\').getAttribute("aria-expanded") === "true"')
    state('Start (Schritt 1 offen)' if offen_beim_start else 'zu, Start')

    for n in range(1, 11):
        btn = fr.query_selector('button[data-row="%d"]' % n)
        if not btn:
            print('Schritt %d: Button nicht gefunden' % n)
            continue
        if n == 1 and offen_beim_start:
            btn.click()                      # zuklappen
            page.wait_for_timeout(1200)
            state('alle zu')
            btn.click()                      # wieder in den Auslieferungszustand
            page.wait_for_timeout(900)
            continue
        btn.click()
        page.wait_for_timeout(1600)
        state('Schritt %d offen' % n)
        btn.click()
        page.wait_for_timeout(900)
    print()
    print('groesster Ueberhang:', worst[0], 'px')
    b.close()
