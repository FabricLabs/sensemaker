'use strict';

const React = require('react');
const Toast = require('./Toast');

/**
 * Custom Toast Container for managing multiple toasts
 */
class ToastContainer extends React.Component {
  render() {
    const { toasts = [], onDismiss } = this.props;
    
    if (toasts.length === 0) {
      return null;
    }

    const containerStyle = {
      position: 'fixed',
      top: '16px',
      right: '16px',
      zIndex: 9999,
      width: '320px',
      pointerEvents: 'none' // Allow clicks to pass through container
    };

    const toastStyle = {
      pointerEvents: 'auto' // Re-enable clicks on individual toasts
    };

    return (
      <div style={containerStyle}>
        {toasts.map(toast => (
          <div key={toast.id} style={toastStyle}>
            <Toast
              id={toast.id}
              type={toast.type}
              message={toast.message}
              header={toast.header}
              duration={toast.duration}
              dismissOnClick={toast.dismissOnClick}
              onDismiss={onDismiss}
            />
          </div>
        ))}
      </div>
    );
  }
}

module.exports = ToastContainer; 