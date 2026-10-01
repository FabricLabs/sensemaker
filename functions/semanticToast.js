'use strict';

const { toast } = require('react-toastify');
const React = require('react');

/**
 * Semantic UI styled toast notifications
 * Wraps react-toastify to automatically apply Semantic UI message classes
 */
const semanticToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      className: 'ui success message',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      className: 'ui error message',
      autoClose: 6000, // Errors stay a bit longer
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  },

  warning: (message, options = {}) => {
    return toast.warning(message, {
      className: 'ui warning message',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  },

  info: (message, options = {}) => {
    return toast.info(message, {
      className: 'ui info message',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  },

  // Default toast (uses info styling)
  default: (message, options = {}) => {
    return semanticToast.info(message, options);
  }
};

// Export both the semantic wrapper and original toast for flexibility
module.exports = {
  toast: semanticToast,
  originalToast: toast
};