import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

type MetricHandler = (metric: { name: string; value: number; rating: string }) => void;

/**
 * Reports Core Web Vitals to console (and optionally to analytics)
 */
export function reportWebVitals(onReport?: MetricHandler): void {
  const handleMetric: MetricHandler = metric => {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.warn(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
    }

    // Call custom handler if provided
    if (onReport) {
      onReport(metric);
    }
  };

  onCLS(handleMetric);
  onFCP(handleMetric);
  onINP(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);
}
