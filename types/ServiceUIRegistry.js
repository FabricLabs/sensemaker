'use strict';

/**
 * Service UI Registry
 * Manages service-provided UI components and their routes.
 * Allows services to declare UI components that will be automatically
 * integrated into the Sensemaker dashboard.
 */
class ServiceUIRegistry {
  constructor () {
    this.services = new Map();
    this.routes = [];
    this.components = new Map();
  }

  /**
   * Register UI components from a service.
   * @param {String} serviceName - Name of the service (e.g., 'star-citizen')
   * @param {Object} config - UI configuration
   * @param {String} config.name - Display name of the service
   * @param {String} config.icon - Icon name (semantic-ui-react icon)
   * @param {String} config.basePath - Base path for service routes (e.g., '/services/star-citizen')
   * @param {Array} config.routes - Array of route definitions
   * @param {Object} config.routes[].path - Route path (relative to basePath)
   * @param {String|Function} config.routes[].component - Component name or require path
   * @param {String} config.routes[].title - Page title
   * @param {String} config.routes[].icon - Route icon (optional)
   * @param {Boolean} config.routes[].exact - Exact path match (default: true)
   * @param {Object} config.metadata - Additional metadata
   */
  register (serviceName, config) {
    if (this.services.has(serviceName)) {
      console.warn(`[SERVICE-UI] Service "${serviceName}" already registered, updating...`);
    }

    const fullConfig = {
      name: config.name || serviceName,
      icon: config.icon || 'plug',
      basePath: config.basePath || `/services/${serviceName}`,
      routes: config.routes || [],
      metadata: config.metadata || {},
      serviceName
    };

    // Expand routes with full paths
    const expandedRoutes = fullConfig.routes.map(route => ({
      ...route,
      fullPath: route.path.startsWith('/')
        ? route.path
        : `${fullConfig.basePath}${route.path.startsWith('/') ? '' : '/'}${route.path}`,
      serviceName,
      component: route.component
    }));

    this.services.set(serviceName, fullConfig);

    // Store routes for later use
    expandedRoutes.forEach(route => {
      this.routes.push(route);
      const componentKey = `${serviceName}:${route.path}`;
      this.components.set(componentKey, {
        serviceName,
        route,
        config: fullConfig
      });
    });

    return this;
  }

  /**
   * Get all routes for a service.
   * @param {String} serviceName - Name of the service
   * @returns {Array} Array of route definitions
   */
  getServiceRoutes (serviceName) {
    return this.routes.filter(r => r.serviceName === serviceName);
  }

  /**
   * Get all registered routes.
   * @returns {Array} Array of all route definitions
   */
  getAllRoutes () {
    return [...this.routes];
  }

  /**
   * Get service configuration.
   * @param {String} serviceName - Name of the service
   * @returns {Object|null} Service configuration or null
   */
  getService (serviceName) {
    return this.services.get(serviceName) || null;
  }

  /**
   * Get all registered services.
   * @returns {Array} Array of service configurations
   */
  getAllServices () {
    return Array.from(this.services.values());
  }

  /**
   * Get navigation menu items for services.
   * @returns {Array} Array of menu item configurations
   */
  getNavigationItems () {
    return this.getAllServices().map(service => ({
      name: service.name,
      path: service.basePath,
      icon: service.icon,
      serviceName: service.serviceName,
      routes: service.routes
    }));
  }

  /**
   * Load a component dynamically.
   * @param {String} serviceName - Name of the service
   * @param {String} componentPath - Path or name of the component
   * @returns {React.Component|null} Loaded component or null
   */
  async loadComponent (serviceName, componentPath) {
    const service = this.services.get(serviceName);
    if (!service) {
      console.warn(`[SERVICE-UI] Service "${serviceName}" not found`);
      return null;
    }

    try {
      // If componentPath is a function (already loaded), return it
      if (typeof componentPath === 'function') {
        return componentPath;
      }

      // Try to load from service package
      const packageName = service.metadata?.packageName || serviceName;

      // Try different patterns:
      // 1. Direct require with package name
      // 2. Relative path from service
      // 3. Absolute path

      let Component = null;
      try {
        // Pattern: @rsi/star-citizen/components/MissionHome
        Component = require(`${packageName}/${componentPath}`);
      } catch (e1) {
        try {
          // Pattern: relative to service
          Component = require(`../services/${serviceName}/components/${componentPath}`);
        } catch (e2) {
          try {
            // Pattern: absolute path
            Component = require(componentPath);
          } catch (e3) {
            console.error(`[SERVICE-UI] Could not load component "${componentPath}" for service "${serviceName}":`, e3);
            return null;
          }
        }
      }

      return Component;
    } catch (error) {
      console.error(`[SERVICE-UI] Error loading component for service "${serviceName}":`, error);
      return null;
    }
  }

  /**
   * Unregister a service.
   * @param {String} serviceName - Name of the service
   */
  unregister (serviceName) {
    if (this.services.has(serviceName)) {
      this.services.delete(serviceName);
      this.routes = this.routes.filter(r => r.serviceName !== serviceName);

      // Clean up components map
      const keysToDelete = [];
      this.components.forEach((value, key) => {
        if (value.serviceName === serviceName) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.components.delete(key));
    }
    return this;
  }

  /**
   * Clear all registered services.
   */
  clear () {
    this.services.clear();
    this.routes = [];
    this.components.clear();
    return this;
  }
}

// Singleton instance
let instance = null;

/**
 * Get the global Service UI Registry instance.
 * @returns {ServiceUIRegistry} Global registry instance
 */
function getRegistry () {
  if (!instance) {
    instance = new ServiceUIRegistry();
  }
  return instance;
}

module.exports = { ServiceUIRegistry, getRegistry };

