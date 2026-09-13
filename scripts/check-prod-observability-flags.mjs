#!/usr/bin/env node
/**
 * CI guard: fail if content-capture flags are true in the environment under test.
 * Mirrors src/lib/observability.ts listEnabledDangerousObservabilityFlags.
 */
const FLAGS = [
  'LOG_REQUEST_BODIES',
  'LOG_WEBSOCKET_PAYLOADS',
  'SESSION_REPLAY_ENABLED',
  'PRODUCT_ANALYTICS_ENABLED',
];

const bad = FLAGS.filter((f) => {
  const v = (process.env[f] || 'false').toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
});

if (bad.length) {
  console.error('FAIL: content-capture flags must be false:', bad.join(', '));
  process.exit(1);
}
console.log('OK: observability content-capture flags are false/unset');
