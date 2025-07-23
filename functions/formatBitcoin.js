'use strict';

module.exports = (value) => {
  // Convert to number if it's a string, or use 0 if invalid
  const num = Number(value) || 0;
  // First get the full 8 decimal places
  const parts = num.toFixed(8).split('.');
  // Remove trailing zeros from the decimal part, but keep at least 2 places
  parts[1] = parts[1].replace(/0+$/, '').padEnd(2, '0');
  // Add commas to the integer part
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};