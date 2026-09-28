// app/filters/filter-utils.js
// Shared filter utilities

/**
 * Check if a subdist value matches the filter
 * Handles base numbers (3 matches 3A, 3B) and exact matches
 */
export function matchesSubdistFilter(subdistValue, filterValue) {
  if (!filterValue) return true;

  const cleanValue = String(subdistValue).trim();
  const cleanFilter = String(filterValue).trim();

  // Exact match
  if (cleanValue === cleanFilter) return true;

  // Base number match (e.g., "3A" matches "3")
  if (cleanValue.startsWith(cleanFilter) &&
      /^[A-Za-z]+$/.test(cleanValue.slice(cleanFilter.length))) {
    return true;
  }

  return false;
}

/**
 * Get the letter suffix from a precinct ID
 * "3A" -> "A", "3B" -> "B", "3" -> null
 */
export function getPrecinctSuffix(precinctId) {
  if (!precinctId) return null;

  const str = String(precinctId).trim();
  const lastChar = str.slice(-1).toUpperCase();

  return /[A-Z]/.test(lastChar) ? lastChar : null;
}

/**
 * Get the base number from a precinct ID
 * "3A" -> "3", "3B" -> "3", "3" -> "3"
 */
export function getPrecinctBase(precinctId) {
  if (!precinctId) return null;

  return String(precinctId).trim().replace(/[A-Za-z]+$/, "");
}
