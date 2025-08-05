const USAGE = `HTTP GET | URL https://dummyjson.com/quotes/3 | HEADERS {"Content-Type": "application/json"} | QUERY {"refid": 123456} `;
const appError = (message) => ({
  error: true,
  message,
});

function parseSection(section) {
  const [rawKey, ...rest] = section.trim().split(' ');
  if (!rawKey || rest.length === 0) return [null, null];
  const key = rawKey.trim();
  const value = rest.join(' ').trim();
  return [key, value];
}
function validateSpacing(reqline) {
  // Step 1: Make sure pipes are surrounded by exactly one space on each side
  const rawParts = reqline.split('|');
  for (let i = 0; i < rawParts.length - 1; i++) {
    const before = reqline.indexOf(
      '|',
      i > 0 ? reqline.indexOf(rawParts[i - 1]) + rawParts[i - 1].length : 0
    );
    if (reqline[before - 1] !== ' ' || reqline[before + 1] !== ' ') {
      return false; // pipe not surrounded by one space
    }
  }

  // Step 2: Process each section
  const parts = reqline.split(' | '); // this enforces pipe spacing
  for (const part of parts) {
    // Should be exactly one space between keyword and value
    const firstSpaceIndex = part.indexOf(' ');
    if (firstSpaceIndex === -1) return false; // missing space
    const keyword = part.slice(0, firstSpaceIndex);
    const value = part.slice(firstSpaceIndex + 1);

    // Ensure keyword is all uppercase and non-empty
    if (!keyword || keyword !== keyword.toUpperCase()) return false;

    // Ensure no double spaces in the section
    if (part.includes('  ')) return false;

    // Ensure value is not empty and doesn't start with space
    if (!value || value.startsWith(' ')) return false;
  }

  return true;
}

module.exports = {
  USAGE,
  appError,
  parseSection,
  validateSpacing,
};
