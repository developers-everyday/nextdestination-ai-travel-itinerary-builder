// k6 full load test — ramps up to 2000 virtual users
// Run with: BASE_URL=https://your-render-url.onrender.com k6 run load-tests/k6-load.js
// Install k6: brew install k6 (Mac) or see https://k6.io/docs/getting-started/installation/
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 500 },   // ramp up to 500 VUs
    { duration: '3m', target: 2000 },  // hold at 2000 VUs
    { duration: '1m', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests under 3s
    http_req_failed: ['rate<0.10'],    // <10% error rate
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  const r = http.get(`${BASE}/api/itineraries?limit=10&offset=0`);
  check(r, { 'trending status 200': (res) => res.status === 200 });
  sleep(1);
}
