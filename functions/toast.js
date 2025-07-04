'use strict';

/**
 * Custom toast system using global event emitter
 * This allows any component to show toasts that are managed by Dashboard
 */

// Simple event emitter for toast events
class ToastEmitter {
  constructor () {
    this.listeners = [];
  }

  addListener (callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  emit (toast) {
    this.listeners.forEach(listener => listener(toast));
  }
}

// Global toast emitter instance
const toastEmitter = new ToastEmitter();

// Generate unique IDs for toasts
let toastIdCounter = 0;
const generateToastId = () => `toast_${++toastIdCounter}_${Date.now()}`;

// Toast utility functions
const toast = {
  success: (message, options = {}) => {
    toastEmitter.emit({
      id: generateToastId(),
      type: 'success',
      message,
      duration: options.duration || 4000,
      dismissOnClick: options.dismissOnClick !== false,
      header: options.header,
      ...options
    });
  },

  error: (message, options = {}) => {
    toastEmitter.emit({
      id: generateToastId(),
      type: 'error',
      message,
      duration: options.duration || 6000, // Errors stay longer
      dismissOnClick: options.dismissOnClick !== false,
      header: options.header,
      ...options
    });
  },

  warning: (message, options = {}) => {
    toastEmitter.emit({
      id: generateToastId(),
      type: 'warning',
      message,
      duration: options.duration || 5000,
      dismissOnClick: options.dismissOnClick !== false,
      header: options.header,
      ...options
    });
  },

  info: (message, options = {}) => {
    toastEmitter.emit({
      id: generateToastId(),
      type: 'info',
      message,
      duration: options.duration || 4000,
      dismissOnClick: options.dismissOnClick !== false,
      header: options.header,
      ...options
    });
  },

  // Default toast (uses info styling)
  default: (message, options = {}) => {
    return toast.info(message, options);
  },

  // Function for Dashboard to listen to toast events
  addListener: (callback) => {
    return toastEmitter.addListener(callback);
  }
};

module.exports = { toast };