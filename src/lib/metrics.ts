import { Registry, collectDefaultMetrics, Summary, Counter, Histogram } from 'prom-client';

declare global {
  var _prometheusRegistry: Registry | undefined;
}

const register = global._prometheusRegistry || new Registry();

if (!global._prometheusRegistry) {
  register.setDefaultLabels({
    app: 'shashti-karz'
  });
  
  collectDefaultMetrics({ register });
  global._prometheusRegistry = register;
}

// Http request duration summary
export const httpRequestDurationMicroseconds = new Summary({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in microseconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Counter for total requests
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Gauge for app uptime
export const appUptime = new Counter({
  name: 'app_uptime_seconds_total',
  help: 'Total uptime of the application in seconds',
  registers: [register],
});

export { register };
