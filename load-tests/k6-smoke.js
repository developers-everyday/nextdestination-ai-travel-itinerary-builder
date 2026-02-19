// k6 smoke test — run with: k6 run load-tests/k6-smoke.js
// Against production: BASE_URL=https://your-render-url.onrender.com k6 run load-tests/k6-smoke.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,           // 50 virtual users
  duration: '30s',   // for 30 seconds
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.05'],    // <5% error rate
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  // Hit the trending endpoint (public, no auth, cached)
  // Accept both 200 (normal) and 429 (rate limiter active — working as designed)
  const r = http.get(`${BASE}/api/itineraries?limit=10&offset=0`);
  check(r, { 'status 200 or 429': (res) => res.status === 200 || res.status === 429 });
  sleep(1);
}
