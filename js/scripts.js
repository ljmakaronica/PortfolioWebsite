document.addEventListener('DOMContentLoaded', () => {
    // Spotify Player State
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
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  
    // UI Elements
    const UI = {
        elements: {
            songTitle: document.getElementById('song-title'),
            artistName: document.getElementById('artist-name'),
            albumImage: document.getElementById('album-image'),
        },
        updatePlayer(track) {
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
  
    // Cache Functions
    function getCachedTrack() {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;
        try {
            const { track, timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;
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
  
    // Spotify API Functions
    async function getRecentTrack() {
        const cachedTrack = getCachedTrack();
        if (cachedTrack) {
            console.log('Using cached track data');
            return cachedTrack;
        }
  
        try {
            const response = await fetch('/api/spotify?action=recent');
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
                cacheTrack(trackData);
                return trackData;
            }
        } catch (error) {
            console.error('Error fetching track:', error);
        }
        return null;
    }
  
    function isCacheExpired() {
        const cached = getCachedTrack();
        return !cached;
    }
  
    async function updateSpotifyTrack() {
        const track = await getRecentTrack();
        UI.updatePlayer(track);
    }
  
    // Initialize everything
    updateSpotifyTrack();
  
    // Update when returning to tab AND cache is expired
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && isCacheExpired()) {
            updateSpotifyTrack();
        }
    });
  
    // Check every 5 mins BUT only if tab is active
    const updateInterval = setInterval(() => {
        if (!document.hidden && isCacheExpired()) {
            updateSpotifyTrack();
        }
    }, CACHE_DURATION);
  
    // Cleanup interval on page unload
    window.addEventListener('unload', () => {
        clearInterval(updateInterval);
    });
  });
  