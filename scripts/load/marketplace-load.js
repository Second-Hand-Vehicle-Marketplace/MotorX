// NF-03 load test: buyers browsing the marketplace, run with k6 from a laptop (never from the server).
//
//   k6 run -e BASE_URL=https://motorx.duckdns.org scripts/load/marketplace-load.js --summary-export=docs/test-evidence/k6-summary.json
//
// Stages of 5, 20 and 50 virtual users, 10 minutes each after a warm-up, with a traffic mix of 70%
// browsing, 20% search and 10% vehicle details. Start a 5,000-row CSV import during the 20-user stage.
// All traffic comes from one address, so before the run raise RATE_LIMIT_API_PER_MINUTE and
// RATE_LIMIT_SEARCH_PER_MINUTE in .env and restart the backend; restore them afterwards.
// Run only with the team's agreement and never while someone is demonstrating on the same server.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL;
if (!BASE_URL) throw new Error('Set BASE_URL, e.g. -e BASE_URL=https://motorx.duckdns.org');
const API = `${BASE_URL.replace(/\/$/, '')}/api/v1`;

// Counts which backend copy answered, from the X-Served-By header Caddy adds.
const servedBy = new Counter('served_by');

export const options = {
  stages: [
    { duration: '1m', target: 5 },
    { duration: '10m', target: 5 },
    { duration: '1m', target: 20 },
    { duration: '10m', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '10m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    // PSR-01 / PSR-02: ordinary calls within 2 s at the 95th percentile; PSR-03: search within 5 s.
    'http_req_duration{kind:browse}': ['p(95)<2000'],
    'http_req_duration{kind:details}': ['p(95)<2000'],
    'http_req_duration{kind:search}': ['p(95)<5000'],
    http_req_failed: ['rate<0.01'],
  },
};

const SEARCHES = ['automatic suv under 8m', 'hybrid car in colombo', 'toyota aqua', 'diesel van', 'honda vezel 2018'];
const FILTERS = ['', 'make=Toyota', 'fuelType=hybrid', 'location=Colombo', 'yearMin=2015'];

function record(response, kind) {
  check(response, { [`${kind} answered 200`]: (r) => r.status === 200 });
  const copy = response.headers['X-Served-By'];
  if (copy) servedBy.add(1, { copy });
}

export function setup() {
  const response = http.get(`${API}/listings?page=1&limit=50`);
  if (response.status !== 200) throw new Error(`The site did not answer: ${response.status}`);
  return { ids: response.json('data.listings').map((listing) => listing.id) };
}

export default function ({ ids }) {
  const roll = Math.random();
  if (roll < 0.7) {
    const page = 1 + Math.floor(Math.random() * 3);
    const filter = FILTERS[Math.floor(Math.random() * FILTERS.length)];
    record(http.get(`${API}/listings?page=${page}&limit=9&${filter}`, { tags: { kind: 'browse' } }), 'browse');
  } else if (roll < 0.9) {
    const q = encodeURIComponent(SEARCHES[Math.floor(Math.random() * SEARCHES.length)]);
    record(http.get(`${API}/search?q=${q}&page=1&limit=9`, { tags: { kind: 'search' } }), 'search');
  } else if (ids.length > 0) {
    const id = ids[Math.floor(Math.random() * ids.length)];
    record(http.get(`${API}/listings/${id}`, { tags: { kind: 'details' } }), 'details');
  }
  // A real buyer reads the page before clicking again.
  sleep(1 + Math.random() * 2);
}
