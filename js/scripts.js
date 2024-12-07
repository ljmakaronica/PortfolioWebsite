document.addEventListener('DOMContentLoaded', () => {
    const playerState = {
      currentTrack: {
        title: '',
        artist: '',
        albumUrl: '',
        spotifyUrl: ''
      },
      hasPlayedOnce: false
    };
  
    const CACHE_KEY = 'spotify_track_cache';
    const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
  
    const UI = {
      elements: {
        songTitle: document.getElementById('song-title'),
        artistName: document.getElementById('artist-name'),
        albumImage: document.getElementById('album-image'),
      },
      updatePlayer(track) {
        const widget = document.querySelector('.currently-playing');
        if (!track) return;
  
        const { title, artist, albumUrl, spotifyUrl } = track;
        
        if (title !== playerState.currentTrack.title ||
            artist !== playerState.currentTrack.artist) {
          this.elements.songTitle.textContent = title;
          this.elements.artistName.textContent = artist;
          this.elements.albumImage.src = albumUrl;
          document.getElementById('spotify-link').href = spotifyUrl;
          playerState.currentTrack = { title, artist, albumUrl, spotifyUrl };
          playerState.hasPlayedOnce = true;
        }
      }
    };
  
    function getCachedTrack() {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
  
      try {
        const { track, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
  
        // Return null if cache is too old
        if (age > CACHE_DURATION) {
          localStorage.removeItem(CACHE_KEY);
          return null;
        }
  
        return track;
      } catch (error) {
        console.error('Cache parsing error:', error);
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
    }
  
    function cacheTrack(track) {
      if (!track) return;
      
      const cacheData = {
        track,
        timestamp: Date.now()
      };
  
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    }
  
    async function getRecentTrack() {
      // Try cache first
      const cachedTrack = getCachedTrack();
      if (cachedTrack) {
        console.log('Using cached track data');
        return cachedTrack;
      }
  
      try {
        const response = await fetch('/api/spotify?action=recent');
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('X-RateLimit-Reset');
          console.warn(`Rate limited. Try again after ${new Date(parseInt(retryAfter))}`);
          return null;
        }
        
        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        const track = data.items[0]?.track;
        
        if (track) {
          const trackData = {
            title: track.name,
            artist: track.artists.map(artist => artist.name).join(', '),
            albumUrl: track.album.images[0].url,
            spotifyUrl: track.external_urls.spotify
          };
          
          // Cache the successful response
          cacheTrack(trackData);
          return trackData;
        }
      } catch (error) {
        console.error('Error fetching track:', error);
      }
      return null;
    }
  
    async function updateSpotifyTrack() {
      const track = await getRecentTrack();
      UI.updatePlayer(track);
    }
  
    // Initial load
    updateSpotifyTrack();
  
    // Update track every 15 minutes
    let updateInterval = setInterval(updateSpotifyTrack, CACHE_DURATION);
  
    // Clean up interval on page unload
    window.addEventListener('unload', () => {
      clearInterval(updateInterval);
    });
  });
  
