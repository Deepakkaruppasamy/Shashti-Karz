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

// Business Metrics for Shashti Karz
export const totalBookings = new Counter({
  name: 'shashti_karz_bookings_total',
  help: 'Total number of bookings made on the platform',
  registers: [register],
});

export const totalRevenue = new Counter({
  name: 'shashti_karz_revenue_total',
  help: 'Total revenue generated in Rupees',
  registers: [register],
});

export const activeUsers = new Summary({
  name: 'shashti_karz_active_users',
  help: 'Number of active users on the platform',
  registers: [register],
});

export const serviceBookings = new Counter({
  name: 'shashti_karz_service_bookings_total',
  help: 'Total bookings per service type',
  labelNames: ['service_type'],
  registers: [register],
});

export { register };
