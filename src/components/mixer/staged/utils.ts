
// Helper to format parameter labels
export const formatParamLabel = (param: string): string => {
  // Convert camelCase to Title Case with spaces
  return param
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/([0-9]+)/g, ' $1');
};
