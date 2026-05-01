const crypto = require('crypto');

/**
 * Generates a base64url encoded token.
 * @param {string|number|null} employeeId - The employee ID (or null for generic)
 * @returns {string} - The generated token
 */
function generateToken(employeeId) {
  const timestamp = Date.now();
  let rawToken = '';

  if (employeeId) {
    rawToken = `${employeeId}_${timestamp}`;
  } else {
    rawToken = `GENERIC_${timestamp}`;
  }

  return Buffer.from(rawToken).toString('base64url');
}

/**
 * Decodes a base64url encoded token.
 * @param {string} token - The base64url encoded token
 * @returns {Object} - Object containing employeeId, isGeneric, timestamp, and rawToken
 */
function decodeToken(token) {
  try {
    const rawToken = Buffer.from(token, 'base64url').toString('utf8');
    const parts = rawToken.split('_');

    if (parts.length !== 2) {
      throw new Error('Invalid token format');
    }

    const identifier = parts[0];
    const timestamp = parseInt(parts[1], 10);

    if (isNaN(timestamp)) {
      throw new Error('Invalid timestamp in token');
    }

    return {
      isGeneric: identifier === 'GENERIC',
      employeeId: identifier === 'GENERIC' ? null : identifier,
      timestamp,
      rawToken
    };
  } catch (error) {
    return null; // Invalid token
  }
}

/**
 * Checks if a token is expired (7 days)
 * @param {number} timestamp - The token timestamp
 * @returns {boolean} - True if expired
 */
function isTokenExpired(timestamp) {
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  return (Date.now() - timestamp) > sevenDaysInMs;
}

module.exports = {
  generateToken,
  decodeToken,
  isTokenExpired
};
