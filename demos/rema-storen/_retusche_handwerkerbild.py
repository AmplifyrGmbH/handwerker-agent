# Entfernt die zwei Schriftstellen aus dem Gemini-Bild:
#   1) die englische Tafel an der Wand  («PROJECT COMPLETED - SATISFACTION GUARANTEED»)
#   2) das verstuemmelte Wort auf der Schuerze («HANOWERX»)
# Beide liegen auf gleichmaessigem Grund, darum reicht waagrechtes Interpolieren
# zwischen den Randpixeln links und rechts, plus Rauschen in der lokalen Streuung.
import numpy as np
from PIL import Image, ImageFilter

SRC = r'_archiv/handwerker-zufrieden.original.png'   # unberuehrte Fassung von Gemini
SP = r'.'

im = Image.open(SRC).convert('RGB')
a = np.asarray(im).astype(np.float64)

rng = np.random.default_rng(7)

def fuelle(a, x0, x1, y0, y1, rand=6, weich=1.2):
    """Waagrecht zwischen den Randstreifen interpolieren."""
    links  = a[y0:y1, x0-rand:x0].mean(axis=1)          # (h,3)
    rechts = a[y0:y1, x1:x1+rand].mean(axis=1)
    breite = x1 - x0
    t = np.linspace(0, 1, breite)[None, :, None]
    neu = links[:, None, :] * (1 - t) + rechts[:, None, :] * t
    # Koernung der Umgebung nachbilden, sonst wirkt die Flaeche wie ausgestanzt
    umfeld = a[max(0, y0-rand):y1+rand, x0-rand:x1+rand]
    streuung = float(np.clip(umfeld.std(axis=(0, 1)).mean() * .18, 1.2, 4.0))
    neu = neu + rng.normal(0, streuung, neu.shape)
    a[y0:y1, x0:x1] = np.clip(neu, 0, 255)
    return streuung

# 1) Tafel samt Rahmen und Schattenkante
s1 = fuelle(a, 903, 1014, 292, 373, rand=7)
# 2) Wort auf der Schuerzentasche
s2 = fuelle(a, 707, 776, 315, 339, rand=6)
print('Koernung Tafel %.2f · Schuerze %.2f' % (s1, s2))

out = Image.fromarray(a.astype(np.uint8))

# Die zwei Flicken minimal weichzeichnen, damit keine Kante stehen bleibt
for (x0, x1, y0, y1) in [(903, 1014, 292, 373), (707, 776, 315, 339)]:
    kasten = (x0 - 4, y0 - 4, x1 + 4, y1 + 4)
    stueck = out.crop(kasten).filter(ImageFilter.GaussianBlur(1.1))
    out.paste(stueck, kasten)

out.save(SP + '/handwerker_retuschiert.png')

# Ausspielen in die Groessen, die die Seite braucht:
#   breit  = ganzes Bild, ab 641 px Fensterbreite
#   schmal = enger Schnitt (470,16)-(1300,768), bis 640 px, damit die vier
#            Werkzeuge auf dem Handy noch zu erkennen sind
for name, bild, q in [('handwerker-zufrieden', out, 84),
                      ('handwerker-zufrieden-schmal', out.crop((470, 16, 1300, 768)), 86)]:
    bild.save('assets/%s.webp' % name, 'WEBP', quality=q, method=6)
    bild.save('assets/%s.jpg' % name, 'JPEG', quality=q, progressive=True, optimize=True)
    print('geschrieben assets/%s.webp + .jpg  %s' % (name, bild.size))
out.crop((870, 270, 1040, 400)).resize((680, 520), Image.LANCZOS).save(SP + '/pruef_tafel.png')
out.crop((650, 280, 850, 370)).resize((800, 360), Image.LANCZOS).save(SP + '/pruef_schuerze.png')
print('geschrieben')
