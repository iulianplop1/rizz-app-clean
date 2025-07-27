import React from 'react';

// Performance utilities for debouncing, throttling, and memoization

// Debounce utility for search inputs and expensive operations
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle utility for scroll events and frequent updates
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization utility for expensive calculations
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
};

// Virtual scrolling utilities
export const createVirtualScroller = (itemHeight, containerHeight, totalItems) => {
  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(0 / itemHeight);
  const endIndex = Math.min(startIndex + visibleItems, totalItems);
  
  return {
    startIndex,
    endIndex,
    visibleItems: endIndex - startIndex,
    totalHeight: totalItems * itemHeight,
  };
};

// Performance monitoring
export const performanceMonitor = {
  marks: new Map(),
  
  start(label) {
    this.marks.set(label, performance.now());
  },
  
  end(label) {
    const startTime = this.marks.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`${label}: ${duration.toFixed(2)}ms`);
      this.marks.delete(label);
      return duration;
    }
    return 0;
  },
  
  measure(label, fn) {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  },
};

// Lazy loading utility
export const lazyLoad = (importFn, fallback = null) => {
  let component = null;
  let loading = false;
  let promise = null;
  
  return {
    load() {
      if (component) return Promise.resolve(component);
      if (loading) return promise;
      
      loading = true;
      promise = importFn().then(module => {
        component = module.default || module;
        loading = false;
        return component;
      });
      
      return promise;
    },
    
    getComponent() {
      return component;
    },
    
    isLoading() {
      return loading;
    },
  };
};

// Image optimization utilities
export const imageOptimizer = {
  // Preload critical images
  preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  },
  
  // Lazy load images with intersection observer
  lazyLoadImage(imgElement, src) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          imgElement.src = src;
          observer.unobserve(imgElement);
        }
      });
    });
    
    observer.observe(imgElement);
    return observer;
  },
};

// Memory management utilities
export const memoryManager = {
  // Clear unused event listeners
  cleanupEventListeners(element, eventType) {
    const listeners = element[`_${eventType}Listeners`] || [];
    listeners.forEach(({ listener, options }) => {
      element.removeEventListener(eventType, listener, options);
    });
    element[`_${eventType}Listeners`] = [];
  },
  
  // Track and cleanup timeouts
  timeouts: new Set(),
  
  setTimeout(callback, delay, ...args) {
    const timeoutId = setTimeout(callback, delay, ...args);
    this.timeouts.add(timeoutId);
    return timeoutId;
  },
  
  clearTimeout(timeoutId) {
    clearTimeout(timeoutId);
    this.timeouts.delete(timeoutId);
  },
  
  clearAllTimeouts() {
    this.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.timeouts.clear();
  },
};

// React performance utilities
export const reactPerformance = {
  // Memoize expensive calculations
  useMemoizedValue(value, deps) {
    const [memoizedValue, setMemoizedValue] = React.useState(value);
    
    React.useEffect(() => {
      setMemoizedValue(value);
    }, [value, ...deps]);
    
    return memoizedValue;
  },
  
  // Optimize re-renders with useCallback
  useStableCallback(callback, deps) {
    return React.useCallback(callback, deps);
  },
  
  // Prevent unnecessary re-renders
  useStableRef(value) {
    const ref = React.useRef(value);
    ref.current = value;
    return ref;
  },
};

// Bundle size optimization utilities
export const bundleOptimizer = {
  // Dynamic imports for code splitting
  async importComponent(importFn) {
    try {
      const module = await importFn();
      return module.default || module;
    } catch (error) {
      console.error('Failed to load component:', error);
      return null;
    }
  },
  
  // Preload critical components
  preloadComponent(importFn) {
    return importFn();
  },
};

const performanceUtils = {
  debounce,
  throttle,
  memoize,
  createVirtualScroller,
  performanceMonitor,
  lazyLoad,
  imageOptimizer,
  memoryManager,
  reactPerformance,
  bundleOptimizer,
};

export default performanceUtils; 