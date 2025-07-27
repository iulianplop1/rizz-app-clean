// Comprehensive performance monitoring service
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  // Track Core Web Vitals
  trackCoreWebVitals() {
    if (!this.isEnabled) return;

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric('FID', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.recordMetric('CLS', clsValue);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  // Track API performance
  trackAPIPerformance(url, startTime, endTime, success) {
    if (!this.isEnabled) return;

    const duration = endTime - startTime;
    this.recordMetric(`API_${url}`, duration);
    this.recordMetric('API_SUCCESS_RATE', success ? 1 : 0);
  }

  // Track component render times
  trackComponentRender(componentName, renderTime) {
    if (!this.isEnabled) return;
    this.recordMetric(`COMPONENT_${componentName}`, renderTime);
  }

  // Track user interactions
  trackUserInteraction(action, duration) {
    if (!this.isEnabled) return;
    this.recordMetric(`INTERACTION_${action}`, duration);
  }

  // Track memory usage
  trackMemoryUsage() {
    if (!this.isEnabled || !performance.memory) return;
    
    const memory = performance.memory;
    this.recordMetric('MEMORY_USED', memory.usedJSHeapSize);
    this.recordMetric('MEMORY_TOTAL', memory.totalJSHeapSize);
    this.recordMetric('MEMORY_LIMIT', memory.jsHeapSizeLimit);
  }

  // Track bundle size
  trackBundleSize() {
    if (!this.isEnabled) return;

    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;
    
    scripts.forEach(script => {
      const src = script.src;
      if (src.includes('static/js/')) {
        // Estimate size based on script tag
        totalSize += 100000; // Rough estimate
      }
    });

    this.recordMetric('BUNDLE_SIZE', totalSize);
  }

  // Record a metric
  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name).push({
      value,
      timestamp: Date.now()
    });

    // Keep only last 100 measurements
    if (this.metrics.get(name).length > 100) {
      this.metrics.get(name).shift();
    }

    // Notify observers
    this.notifyObservers(name, value);
  }

  // Get metric statistics
  getMetricStats(name) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    const numbers = values.map(v => v.value);
    return {
      count: numbers.length,
      min: Math.min(...numbers),
      max: Math.max(...numbers),
      avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
      latest: values[values.length - 1].value
    };
  }

  // Subscribe to metric changes
  subscribe(metricName, callback) {
    if (!this.observers.has(metricName)) {
      this.observers.set(metricName, []);
    }
    this.observers.get(metricName).push(callback);
  }

  // Notify observers
  notifyObservers(metricName, value) {
    const callbacks = this.observers.get(metricName) || [];
    callbacks.forEach(callback => callback(value));
  }

  // Generate performance report
  generateReport() {
    const report = {
      timestamp: Date.now(),
      metrics: {},
      summary: {}
    };

    for (const [name, values] of this.metrics) {
      const stats = this.getMetricStats(name);
      if (stats) {
        report.metrics[name] = stats;
      }
    }

    // Generate summary
    report.summary = {
      totalMetrics: this.metrics.size,
      slowestAPI: this.findSlowestMetric('API_'),
      fastestComponent: this.findFastestMetric('COMPONENT_'),
      averageLCP: this.getMetricStats('LCP')?.avg || 0,
      averageFID: this.getMetricStats('FID')?.avg || 0,
      averageCLS: this.getMetricStats('CLS')?.avg || 0
    };

    return report;
  }

  // Find slowest metric by prefix
  findSlowestMetric(prefix) {
    let slowest = null;
    let maxValue = 0;

    for (const [name, values] of this.metrics) {
      if (name.startsWith(prefix)) {
        const stats = this.getMetricStats(name);
        if (stats && stats.avg > maxValue) {
          maxValue = stats.avg;
          slowest = name;
        }
      }
    }

    return slowest;
  }

  // Find fastest metric by prefix
  findFastestMetric(prefix) {
    let fastest = null;
    let minValue = Infinity;

    for (const [name, values] of this.metrics) {
      if (name.startsWith(prefix)) {
        const stats = this.getMetricStats(name);
        if (stats && stats.avg < minValue) {
          minValue = stats.avg;
          fastest = name;
        }
      }
    }

    return fastest;
  }

  // Export metrics for analysis
  exportMetrics() {
    return {
      metrics: Object.fromEntries(this.metrics),
      report: this.generateReport()
    };
  }

  // Clear all metrics
  clear() {
    this.metrics.clear();
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring
if (typeof window !== 'undefined') {
  performanceMonitor.trackCoreWebVitals();
  
  // Track memory usage periodically
  setInterval(() => {
    performanceMonitor.trackMemoryUsage();
  }, 30000); // Every 30 seconds

  // Track bundle size on load
  window.addEventListener('load', () => {
    performanceMonitor.trackBundleSize();
  });
}

export default performanceMonitor; 