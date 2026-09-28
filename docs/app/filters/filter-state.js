// app/filters/filter-state.js
// Centralized filter state management

class FilterState {
  constructor() {
    this.state = {
      view: null,              // "state" | "counties" | "cds" | "precincts"

      // Single feature highlight (red outline)
      highlight: {
        type: null,            // "state" |"county" | "cd" | "precinct"
        value: null,           // "St Louis" | "8" | "3A"
      },

      // Multi-feature filters (show/hide)
      filters: {
        county: null,          // "St Louis"
        subdist: null,         // "3" (shows 3A, 3B, etc)
        precinct: null,        // "3A" (single precinct filter)
      },
    };

    this.listeners = [];
  }

  // Get current state
  getState() {
    return { ...this.state };
  }

  // Set view type
  setView(view) {
    this.state.view = view;

    // Clear filters when changing views
    this.state.highlight = { type: null, value: null };
    this.state.filters = { county: null, subdist: null, precinct: null };

    this._notify();
  }

  // Set highlight (single feature - red outline)
  setHighlight(type, value) {
    this.state.highlight = { type, value };
    this._notify();
  }

  // Clear highlight
  clearHighlight() {
    this.state.highlight = { type: null, value: null };
    this._notify();
  }

  // Set filter (show/hide multiple features)
  setFilter(filterType, value) {
    this.state.filters[filterType] = value;

    // Clear dependent filters
    if (filterType === "county") {
      this.state.filters.subdist = null;
      this.state.filters.precinct = null;
    } else if (filterType === "subdist") {
      this.state.filters.precinct = null;
    }

    this._notify();
  }

  // Clear all filters
  clearFilters() {
    this.state.filters = { county: null, subdist: null, precinct: null };
    this._notify();
  }

  // Subscribe to changes
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Notify listeners
  _notify() {
    this.listeners.forEach(callback => callback(this.getState()));
  }

  // Check if any filters are active
  hasActiveFilters() {
    return Object.values(this.state.filters).some(v => v !== null);
  }

  // Check if highlight is active
  hasActiveHighlight() {
    return this.state.highlight.type !== null && this.state.highlight.value !== null;
  }
}

// Export singleton instance
export const filterState = new FilterState();
