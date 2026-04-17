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

// Helper to avoid duplicate metrics during Next.js Hot Module Replacement
function getOrCreateMetric<T>(type: 'Counter' | 'Summary' | 'Histogram', config: any): T {
  const existing = register.getSingleMetric(config.name);
  if (existing) return existing as unknown as T;
  
  if (type === 'Counter') return new Counter(config) as unknown as T;
  if (type === 'Summary') return new Summary(config) as unknown as T;
  if (type === 'Histogram') return new Histogram(config) as unknown as T;
  throw new Error('Unknown metric type');
}

// Http request duration histogram
export const httpRequestDurationMicroseconds = getOrCreateMetric<Histogram>('Histogram', {
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in microseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Counter for total requests
export const httpRequestsTotal = getOrCreateMetric<Counter>('Counter', {
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Business Metrics for Shashti Karz
export const totalBookings = getOrCreateMetric<Counter>('Counter', {
  name: 'shashti_karz_bookings_total',
  help: 'Total number of bookings made on the platform',
  registers: [register],
});

export const totalRevenue = getOrCreateMetric<Counter>('Counter', {
  name: 'shashti_karz_revenue_total',
  help: 'Total revenue generated in Rupees',
  registers: [register],
});

export const activeUsers = getOrCreateMetric<Summary>('Summary', {
  name: 'shashti_karz_active_users',
  help: 'Number of active users on the platform',
  registers: [register],
});

export const serviceBookings = getOrCreateMetric<Counter>('Counter', {
  name: 'shashti_karz_service_bookings_total',
  help: 'Total bookings per service type',
  labelNames: ['service_type'],
  registers: [register],
});

// Initialize to 0 to prevent "No data" in Grafana
['Basic Wash', 'Premium Detailing', 'Interior Cleaning'].forEach(service => {
  serviceBookings.labels(service).inc(0);
});

export { register };
