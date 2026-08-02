"""Entpackt / packt den __bundler/template-String einer Bundled Page.

unpack.py extract <bundle.html> <out.html>
unpack.py inject  <bundle.html> <in.html>   (schreibt bundle.html in-place)
"""
import sys, json, io

TAG_OPEN = '<script type="__bundler/template">'
TAG_CLOSE = '</script>'


def locate(raw):
    i = raw.index(TAG_OPEN) + len(TAG_OPEN)
    j = raw.index(TAG_CLOSE, i)
    return i, j


def main():
    mode, bundle, other = sys.argv[1], sys.argv[2], sys.argv[3]
    with io.open(bundle, encoding='utf-8', newline='') as f:
        raw = f.read()
    i, j = locate(raw)
    payload = raw[i:j]

    if mode == 'extract':
        inner = json.loads(payload.strip())
        with io.open(other, 'w', encoding='utf-8', newline='') as f:
            f.write(inner)
        print('extracted %d chars -> %s' % (len(inner), other))
    elif mode == 'inject':
        with io.open(other, encoding='utf-8', newline='') as f:
            inner = f.read()
        # ensure_ascii=False haelt Umlaute lesbar; der Bootstrap nutzt JSON.parse,
        # also ist jede gueltige JSON-Zeichenkette in Ordnung. </script> darf im
        # String nicht buchstaeblich stehen -> escapen wie der Original-Bundler.
        enc = json.dumps(inner, ensure_ascii=False)
        enc = enc.replace('</', '<\\u002F')
        assert '</script>' not in enc, 'unescaped </script> in payload'
        new = raw[:i] + '\n' + enc + '\n  ' + raw[j:]
        with io.open(bundle, 'w', encoding='utf-8', newline='') as f:
            f.write(new)
        print('injected %d chars (%d encoded) -> %s' % (len(inner), len(enc), bundle))
    else:
        raise SystemExit('unknown mode ' + mode)


if __name__ == '__main__':
    main()
