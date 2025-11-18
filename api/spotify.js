import { Buffer } from 'buffer';

// Rate limiting state
const rateLimitState = new Map();

// Add cache state
const cache = {
  recentTrack: null,
  timestamp: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

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
  const response = await fetch(
    'https://api.spotify.com/v1/me/player/recently-played?limit=1',
    {
      headers: {
        'Authorization': `Bearer ${process.env.SPOTIFY_ACCESS_TOKEN}`
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
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`
    },
    body: `grant_type=refresh_token&refresh_token=${process.env.SPOTIFY_REFRESH_TOKEN}`
  });

  const data = await response.json();
  if (data.access_token) {
    process.env.SPOTIFY_ACCESS_TOKEN = data.access_token;
  }
}

export default async function handler(req, res) {
  // Check rate limit first
  const rateLimitResponse = await rateLimitMiddleware(req, res);
  if (rateLimitResponse) return rateLimitResponse;

  // Allow only GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const action = req.query.action;

    switch (action) {
      case 'recent':
        try {
          const trackData = await getCachedOrFetchTrack();
          return res.status(200).json(trackData);
        } catch (error) {
          if (error.message.includes('401')) {
            // Token expired, refresh it
            await refreshToken();
            // Clear cache since token was invalid
            cache.recentTrack = null;
            cache.timestamp = null;
            // Retry the request
            return handler(req, res);
          }
          throw error;
        }

      case 'refresh':
        // Clear cache when refreshing token
        cache.recentTrack = null;
        cache.timestamp = null;
        await refreshToken();
        return res.status(200).json({ message: 'Token refreshed' });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
