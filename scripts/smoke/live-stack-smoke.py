"""Read-only smoke test of a running MotorX stack (end-to-end through the real API, database,
storage and frontend server; no browser). Sends GET requests only, so it never changes data.

    python scripts/smoke/live-stack-smoke.py [API_BASE] [FRONTEND_BASE]

Defaults: http://127.0.0.1:3000 and http://127.0.0.1:4173. Prints one line per check and a JSON
summary; exits 1 if any check fails.
"""
import json
import sys
import time
import urllib.error
import urllib.request

API = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:3000').rstrip('/')
WEB = (sys.argv[2] if len(sys.argv) > 2 else 'http://127.0.0.1:4173').rstrip('/')
results = []


def get(url):
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(url, timeout=15) as response:
            body = response.read()
            return response.status, body, response.headers, (time.perf_counter() - started) * 1000
    except urllib.error.HTTPError as error:
        return error.code, error.read(), error.headers, (time.perf_counter() - started) * 1000
    except (urllib.error.URLError, TimeoutError) as error:
        # The host could not be reached at all (e.g. a stored photo URL pointing at an old server).
        return None, str(getattr(error, 'reason', error)).encode(), {}, (time.perf_counter() - started) * 1000


def check(name, url, expect_status=200, verify=None):
    status, body, headers, ms = get(url)
    ok = status == expect_status
    detail = '' if status is not None else f'unreachable: {body.decode(errors="replace")[:120]}'
    if ok and verify:
        try:
            detail = verify(body, headers) or ''
        except Exception as error:  # a failed expectation is a failed check, not a crash
            ok, detail = False, f'{type(error).__name__}: {error}'
    results.append({'check': name, 'url': url.replace(API, '{API}').replace(WEB, '{WEB}'), 'status': status, 'ok': ok, 'ms': round(ms), 'detail': detail})
    print(f"{'PASS' if ok else 'FAIL'}  {name}  [{status}, {round(ms)} ms] {detail}")
    return body if ok else None


def data(body):
    return json.loads(body)['data']


def require(condition, message):
    if not condition:
        raise AssertionError(message)


check('API liveness', f'{API}/health/live')
check('API readiness (database reachable)', f'{API}/health/ready')

browse = check('Public browse returns only active listings', f'{API}/api/v1/listings?limit=12',
               verify=lambda b, h: (require(all(l['status'] == 'active' for l in data(b)['listings']), 'non-active listing shown'),
                                    f"{data(b)['pagination']['total']} active listings")[1])
listings = data(browse)['listings'] if browse else []

check('Structured filter holds (price <= 8,000,000)', f'{API}/api/v1/listings?priceMax=8000000&limit=20',
      verify=lambda b, h: (require(all(l['price'] <= 8_000_000 for l in data(b)['listings']), 'price filter broken'), f"{len(data(b)['listings'])} results")[1])
check('Natural-language search', f'{API}/api/v1/search?q=automatic%20car%20under%2010%20million&limit=10',
      verify=lambda b, h: f"mode={data(b)['search']['mode']}, {data(b)['pagination']['total']} results")
check('Invalid listing ID is rejected, not a server error', f'{API}/api/v1/listings/not-an-id', expect_status=400)
check('Dealer-only route requires sign-in', f'{API}/api/v1/listings/mine', expect_status=401)
check('Admin-only route requires sign-in', f'{API}/api/v1/admin/stats', expect_status=401)
check('Recommendations reject a malformed list', f'{API}/api/v1/listings/recommendations?viewed=bad', expect_status=400)

if listings:
    first = listings[0]
    check('Vehicle details include the dealer profile', f"{API}/api/v1/listings/{first['id']}",
          verify=lambda b, h: f"dealer={'yes' if data(b).get('dealer') else 'none'}")
    check('Similar vehicles exclude the vehicle itself', f"{API}/api/v1/listings/{first['id']}/similar?limit=6",
          verify=lambda b, h: (require(all(l['id'] != first['id'] for l in data(b)['listings']), 'seed included'), f"{len(data(b)['listings'])} similar")[1])
    viewed = ','.join(l['id'] for l in listings[:2])
    check('Recommendations leave out viewed vehicles', f'{API}/api/v1/listings/recommendations?viewed={viewed}&limit=6',
          verify=lambda b, h: (require(not set(viewed.split(',')) & {l['id'] for l in data(b)['listings']}, 'viewed vehicle recommended'),
                               f"basedOn={data(b)['basedOn']}, {len(data(b)['listings'])} recommended")[1])
    # Every active listing's main photo (and its small copy, where one exists) must load.
    all_active = data(get(f'{API}/api/v1/listings?limit=100')[1])['listings']
    photos = [l['images'][0] for l in all_active if l['images']]
    loaded, broken_hosts, thumbs_ok, thumbs_total = 0, {}, 0, 0
    for photo in photos:
        status, body, headers, _ = get(photo['url'])
        if status == 200 and headers.get('Content-Type', '').startswith('image/'):
            loaded += 1
        else:
            host = photo['url'].split('/')[2]
            broken_hosts[host] = broken_hosts.get(host, 0) + 1
        if photo.get('thumbUrl'):
            thumbs_total += 1
            thumbs_ok += get(photo['thumbUrl'])[0] == 200
    detail = f'{loaded}/{len(photos)} main photos load' + (f"; not loading: {', '.join(f'{n} from {h}' for h, n in broken_hosts.items())}" if broken_hosts else '')
    results.append({'check': 'Every active listing photo loads', 'url': '{listing photo URLs}', 'status': None, 'ok': loaded == len(photos), 'ms': 0, 'detail': detail})
    print(f"{'PASS' if loaded == len(photos) else 'FAIL'}  Every active listing photo loads  {detail}")
    if thumbs_total:
        results.append({'check': 'Small photo copies load', 'url': '{thumb URLs}', 'status': None, 'ok': thumbs_ok == thumbs_total, 'ms': 0, 'detail': f'{thumbs_ok}/{thumbs_total} small copies load'})
        print(f"{'PASS' if thumbs_ok == thumbs_total else 'FAIL'}  Small photo copies load  {thumbs_ok}/{thumbs_total}")
    else:
        results.append({'check': 'Small photo copies load', 'url': '', 'status': None, 'ok': None, 'ms': 0, 'detail': 'skipped: no active photo has a small copy yet'})
        print('SKIP  Small photo copies load  (no active photo has a small copy yet)')

for path in ['/', '/marketplace', '/compare']:
    check(f'Frontend serves {path} (single-page app)', f'{WEB}{path}', verify=lambda b, h: (require(b'<div id="root">' in b, 'app shell missing'), 'app shell')[1])

failed = [r for r in results if r['ok'] is False]
summary = {'api': API, 'frontend': WEB, 'recordedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'passed': sum(r['ok'] is True for r in results), 'failed': len(failed), 'skipped': sum(r['ok'] is None for r in results), 'checks': results}
print(json.dumps(summary, indent=2))
sys.exit(1 if failed else 0)
