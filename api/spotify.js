export default async function handler(req, res) {
    // Allow only GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      // Handle different endpoints based on the request
      const action = req.query.action;
  
      switch (action) {
        case 'recent':
          // Get recent tracks
          const recentResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
            headers: {
              'Authorization': `Bearer ${process.env.SPOTIFY_ACCESS_TOKEN}`
            }
          });
  
          if (recentResponse.status === 401) {
            // Token expired, refresh it
            await refreshToken();
            // Retry the request
            return handler(req, res);
          }
  
          const recentData = await recentResponse.json();
          return res.status(200).json(recentData);
  
        case 'refresh':
          // Refresh token
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