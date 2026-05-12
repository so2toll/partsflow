/**
 * Widget Registry System
 * Manages multi-tenant widget resolution based on organization, feature type, and role
 */

import widgetRegistryData from '../../data/widget-registry.json';

class WidgetRegistry {
  constructor() {
    this.registry = widgetRegistryData.registry;
    this.cache = new Map();
  }

  /**
   * Resolve widget component for a specific organization, feature, and role
   * @param {string} internalId - Internal project ID (e.g., 'proj_vcmp_7f8a9b2c4d5e')
   * @param {string} feature - Feature type (e.g., 'signature', 'document-ai')
   * @param {string} role - User role (e.g., 'advocate', 'victim', 'counselor')
   * @param {object} options - Additional options
   * @returns {object} Widget configuration or null
   */
  resolve(internalId, feature, role, options = {}) {
    // Check cache first
    const cacheKey = `${internalId}:${feature}:${role}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Default feature to 'signature' for backward compatibility
    const widgetFeature = feature || 'signature';

    // Try to get org-specific widget
    const project = this.registry[internalId];
    if (project?.widgets?.[widgetFeature]?.[role]) {
      const widget = project.widgets[widgetFeature][role];
      const result = {
        ...widget,
        projectName: project.name,
        internalId,
        feature: widgetFeature,
        role,
        isCustom: true
      };
      this.cache.set(cacheKey, result);
      return result;
    }

    // Fall back to base widget if allowed
    if (options.fallback !== false) {
      const baseProject = this.registry.base;
      if (baseProject?.widgets?.[widgetFeature]?.[role]) {
        const widget = baseProject.widgets[widgetFeature][role];
        const result = {
          ...widget,
          projectName: project?.name || 'Unknown',
          internalId,
          feature: widgetFeature,
          role,
          isCustom: false
        };
        this.cache.set(cacheKey, result);
        return result;
      }
    }

    return null;
  }

  /**
   * Get widget path for dynamic import
   * @param {string} internalId - Internal project ID
   * @param {string} feature - Feature type
   * @param {string} role - User role
   * @returns {string} Widget path or null
   */
  getWidgetPath(internalId, feature, role) {
    const widget = this.resolve(internalId, feature, role);
    if (!widget) return null;

    // Return path relative to widgets directory
    return `/src/widgets/${widget.path}`;
  }

  /**
   * Check if organization has custom widget
   * @param {string} internalId - Internal project ID
   * @param {string} feature - Feature type
   * @param {string} role - User role
   * @returns {boolean} True if custom widget exists
   */
  hasCustomWidget(internalId, feature, role) {
    const widget = this.resolve(internalId, feature, role, { fallback: false });
    return widget !== null;
  }

  /**
   * Get all available features for an organization
   * @param {string} internalId - Internal project ID
   * @returns {array} List of available features
   */
  getAvailableFeatures(internalId) {
    const project = this.registry[internalId];
    if (!project?.widgets) return ['signature']; // Default feature

    return Object.keys(project.widgets);
  }

  /**
   * Get all available roles for an organization and feature
   * @param {string} internalId - Internal project ID
   * @param {string} feature - Feature type
   * @returns {array} List of available roles
   */
  getAvailableRoles(internalId, feature) {
    const project = this.registry[internalId];
    if (!project?.widgets?.[feature]) {
      // Return base roles as fallback
      return this.registry.base?.widgets?.[feature]
        ? Object.keys(this.registry.base.widgets[feature])
        : ['advocate', 'victim'];
    }

    return Object.keys(project.widgets[feature]);
  }

  /**
   * Get custom roles for an organization
   * @param {string} internalId - Internal project ID
   * @returns {array} List of custom roles
   */
  getCustomRoles(internalId) {
    const project = this.registry[internalId];
    return project?.customRoles || [];
  }

  /**
   * Get organization features configuration
   * @param {string} internalId - Internal project ID
   * @returns {object} Features configuration
   */
  getFeatures(internalId) {
    const project = this.registry[internalId];
    return project?.features || {};
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Create singleton instance
const widgetRegistry = new WidgetRegistry();

// Export both the class and the singleton instance
export { WidgetRegistry };
export default widgetRegistry;