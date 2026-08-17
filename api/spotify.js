import { Buffer } from 'buffer';

// ─── Module-level token cache (persists across warm serverless invocations) ───
let cachedAccessToken = null;

// ─── Rate limiting state ───
const rateLimitState = new Map();

// ─── Track data cache ───
const cache = {
  recentTrack: null,
  timestamp: null
};

const CACHE_DURATION = 30 * 1000; // 30 seconds

// Clean up old rate limit entries every hour
setInterval(() => {
  const hourAgo = Date.now() - 3600000;
  for (const [ip, data] of rateLimitState.entries()) {
    if (data.timestamp < hourAgo) {
      rateLimitState.delete(ip);
    }
  }
}, 3600000);

// Utility function to get IP address
function getIP(req) {
  return req.ip ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.connection.remoteAddress ||
         '0.0.0.0';
}

function getAccessToken() {
  return cachedAccessToken || process.env.SPOTIFY_ACCESS_TOKEN;
}

function getRefreshToken() {
  return process.env.SPOTIFY_REFRESH_TOKEN;
}

async function rateLimitMiddleware(req, res) {
  const ip = getIP(req);
  const now = Date.now();

  // Initialize or get existing rate limit data
  if (!rateLimitState.has(ip)) {
    rateLimitState.set(ip, {
      count: 0,
      timestamp: now,
      blocked: false
    });
  }

  const data = rateLimitState.get(ip);

  // Reset counter if it's been over an hour
  if (now - data.timestamp > 3600000) {
    data.count = 0;
    data.timestamp = now;
    data.blocked = false;
  }

  // Check if blocked
  if (data.blocked) {
    return res.status(429).json({
      error: 'Too many requests. Please try again in an hour.'
    });
  }

  // Increment counter
  data.count++;

  // Block if exceeds limit
  const HOURLY_LIMIT = 83; // Match Vercel's limit
  if (data.count > HOURLY_LIMIT) {
    data.blocked = true;
    return res.status(429).json({
      error: 'Rate limit exceeded. Please try again in an hour.'
    });
  }

  // Update state
  rateLimitState.set(ip, data);

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', HOURLY_LIMIT);
  res.setHeader('X-RateLimit-Remaining', HOURLY_LIMIT - data.count);
  res.setHeader('X-RateLimit-Reset', data.timestamp + 3600000);

  return null;
}

async function getCachedOrFetchTrack() {
  const now = Date.now();

  // Check if cache is valid
  if (cache.recentTrack && cache.timestamp &&
      (now - cache.timestamp) < CACHE_DURATION) {
    console.log('Serving cached track data');
    return cache.recentTrack;
  }

  // Fetch fresh data
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const response = await fetch(
    'https://api.spotify.com/v1/me/player/recently-played?limit=1',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status}`);
  }

  const data = await response.json();

  // Update cache
  cache.recentTrack = data;
  cache.timestamp = now;

  console.log('Fetched and cached fresh track data');
  return data;
}

async function refreshToken() {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    throw new Error('REFRESH_TOKEN_EXPIRED');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`
    },
    body: `grant_type=refresh_token&refresh_token=${currentRefreshToken}`
  });

  const data = await response.json();

  // Handle expired or invalid refresh token
  if (data.error === 'invalid_grant') {
    cachedAccessToken = null;
    throw new Error('REFRESH_TOKEN_EXPIRED');
  }

  if (!data.access_token) {
    throw new Error(`Token refresh failed: ${data.error || 'unknown error'}`);
  }

  // Cache the new access token
  cachedAccessToken = data.access_token;
}

export default async function handler(req, res) {
  // Check rate limit first
  const rateLimitResponse = await rateLimitMiddleware(req, res);
  if (rateLimitResponse) return rateLimitResponse;

  // Allow only GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Retry guard — pulled from query to prevent infinite recursion
  const isRetry = req.query._retry === '1';

  try {
    const action = req.query.action;

    switch (action) {
      case 'recent':
        try {
          // If we have no access token yet, refresh first
          if (!getAccessToken()) {
            await refreshToken();
          }
          const trackData = await getCachedOrFetchTrack();
          return res.status(200).json(trackData);
        } catch (error) {
          if (error.message === 'REFRESH_TOKEN_EXPIRED') {
            return res.status(401).json({
              error: 'REFRESH_TOKEN_EXPIRED',
              message: 'Spotify refresh token has expired. Re-authorization required.'
            });
          }
          if (error.message.includes('401') && !isRetry) {
            // Access token expired — refresh and retry once
            try {
              await refreshToken();
            } catch (refreshError) {
              if (refreshError.message === 'REFRESH_TOKEN_EXPIRED') {
                return res.status(401).json({
                  error: 'REFRESH_TOKEN_EXPIRED',
                  message: 'Spotify refresh token has expired. Re-authorization required.'
                });
              }
              throw refreshError;
            }
            // Clear track cache since token was invalid
            cache.recentTrack = null;
            cache.timestamp = null;
            // Retry once with guard flag
            req.query._retry = '1';
            return handler(req, res);
          }
          throw error;
        }

      case 'refresh':
        // Clear cache when refreshing token
        cache.recentTrack = null;
        cache.timestamp = null;
        try {
          await refreshToken();
        } catch (error) {
          if (error.message === 'REFRESH_TOKEN_EXPIRED') {
            return res.status(401).json({
              error: 'REFRESH_TOKEN_EXPIRED',
              message: 'Spotify refresh token has expired. Re-authorization required.'
            });
          }
          throw error;
        }
        return res.status(200).json({ message: 'Token refreshed' });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
