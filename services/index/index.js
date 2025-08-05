const axios = require('axios');
const { USAGE, appError, validateSpacing, parseSection } = require('../utils/reqline');

const allowedMethods = ['GET', 'POST'];
const requiredKeywords = ['HTTP', 'URL'];
const validKeywords = ['HTTP', 'URL', 'HEADERS', 'QUERY', 'BODY'];

const reqlineService = async (reqline) => {
  if (!reqline || typeof reqline !== 'string') {
    return appError(`Invalid format. Correct format is ${USAGE}`);
  }

  if (!validateSpacing(reqline)) {
    return appError(
      'Invalid spacing around pipe delimiter or multiple spaces found where single space expected'
    );
  }

  const sections = reqline.split('|').map((s) => s.trim());
  const parsed = {};

  for (const section of sections) {
    const [key, value] = parseSection(section);
    if (!key || !value) {
      return appError(`Missing space after keyword or malformed section: "${section}"`);
    }

    if (!validKeywords.includes(key)) {
      return appError('Keywords must be uppercase and valid: HTTP, URL, HEADERS, QUERY, BODY');
    }

    if (parsed[key]) {
      return appError(`Duplicate keyword found: ${key}`);
    }

    parsed[key] = value;
  }

  // Validate required
  if (!parsed.HTTP) return appError('Missing required HTTP keyword');
  if (!parsed.URL) return appError('Missing required URL keyword');

  const method = parsed.HTTP;
  if (!allowedMethods.includes(method)) {
    return appError('Invalid HTTP method. Only GET and POST are supported');
  }

  // Prepare values
  let headers = {};
  let query = {};
  let body = {};

  try {
    if (parsed.HEADERS) headers = JSON.parse(parsed.HEADERS);
  } catch (err) {
    return appError('Invalid JSON format in HEADERS section');
  }

  try {
    if (parsed.QUERY) query = JSON.parse(parsed.QUERY);
  } catch (err) {
    return appError('Invalid JSON format in QUERY section');
  }

  try {
    if (parsed.BODY) body = JSON.parse(parsed.BODY);
  } catch (err) {
    return appError('Invalid JSON format in BODY section');
  }

  const fullUrl = new URL(parsed.URL);
  Object.entries(query).forEach(([key, val]) => fullUrl.searchParams.append(key, val));

  const config = {
    method,
    url: fullUrl.toString(),
    headers,
    ...(method === 'POST' ? { data: body } : {}),
  };

  const request_start_timestamp = Date.now();
  try {
    const response = await axios(config);
    const request_stop_timestamp = Date.now();

    return {
      request: {
        query,
        body,
        headers,
        full_url: fullUrl.toString(),
      },
      response: {
        http_status: response.status,
        duration: request_stop_timestamp - request_start_timestamp,
        request_start_timestamp,
        request_stop_timestamp,
        response_data: response.data,
      },
    };
  } catch (err) {
    const request_stop_timestamp = Date.now();
    return {
      request: {
        query,
        body,
        headers,
        full_url: fullUrl.toString(),
      },
      response: {
        http_status: err.response?.status || 500,
        duration: request_stop_timestamp - request_start_timestamp,
        request_start_timestamp,
        request_stop_timestamp,
        response_data: err.response?.data || { message: 'Request failed' },
      },
    };
  }
};

module.exports = reqlineService;
