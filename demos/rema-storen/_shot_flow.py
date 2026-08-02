"""Screenshot des Auftragsfluss-Abschnitts in der Elternseite, optional mit offenem Schritt."""
import sys
from playwright.sync_api import sync_playwright

out = sys.argv[1]
row = int(sys.argv[2]) if len(sys.argv) > 2 else 0
width = int(sys.argv[3]) if len(sys.argv) > 3 else 1400

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': width, 'height': 1100})
    page.goto('http://localhost:8090/REMA_Storen_Demo_v3.html', wait_until='networkidle')
    page.add_style_tag(content='.reveal{opacity:1!important;transform:none!important}header.top{position:static!important}')
    page.wait_for_timeout(1200)
    page.eval_on_selector('.flow-iframe', 'e => e.scrollIntoView()')
    page.wait_for_timeout(3000)
    if row:
        fr = [f for f in page.frames if 'auftragsfluss' in (f.url or '')][0]
        fr.query_selector('button[data-row="%d"]' % row).click()
        page.wait_for_timeout(1800)
    page.eval_on_selector('.flow-iframe', 'e => e.scrollIntoView()')
    page.wait_for_timeout(400)
    page.locator('section.flow').screenshot(path=out)
    print('OK:', out)
    b.close()
