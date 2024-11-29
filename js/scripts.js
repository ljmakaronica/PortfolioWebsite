document.addEventListener('DOMContentLoaded', () => {
    // Spotify player state management
    const playerState = {
        currentTrack: {
            title: '',
            artist: '',
            albumUrl: ''
        },
        hasPlayedOnce: false
    };
 
    const spotifyConfig = {
        accessToken: process.env.SPOTIFY_ACCESS_TOKEN,
        refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    };
 
    // Check if Spotify credentials exist
    const hasSpotifyCredentials = spotifyConfig.accessToken && 
                                spotifyConfig.refreshToken && 
                                spotifyConfig.clientId && 
                                spotifyConfig.clientSecret;
 
    // Spotify API handlers
    const spotifyAPI = {
        async refreshToken() {
            try {
                const response = await fetch('https://accounts.spotify.com/api/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ' + btoa(`${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`)
                    },
                    body: `grant_type=refresh_token&refresh_token=${spotifyConfig.refreshToken}`
                });
 
                const data = await response.json();
                if (data.access_token) {
                    spotifyConfig.accessToken = data.access_token;
                }
            } catch (error) {
                console.error('Error refreshing token:', error);
            }
        },
 
        async getRecentTrack() {
            try {
                const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
                    headers: {
                        'Authorization': `Bearer ${spotifyConfig.accessToken}`
                    }
                });
        
                if (response.status === 401) {
                    await this.refreshToken();
                    return this.getRecentTrack();
                }
        
                if (response.ok) {
                    const data = await response.json();
                    const track = data.items[0]?.track;
                    
                    if (track) {
                        return {
                            title: track.name,
                            artist: track.artists.map(artist => artist.name).join(', '),
                            albumUrl: track.album.images[0].url,
                            spotifyUrl: track.external_urls.spotify
                        };
                    }
                }
            } catch (error) {
                console.error('Error fetching track:', error);
            }
            return null;
        }
    };
 
    // UI handlers for Spotify player
    const UI = {
        elements: {
            songTitle: document.getElementById('song-title'),
            artistName: document.getElementById('artist-name'),
            albumImage: document.getElementById('album-image'),
        },
 
        updatePlayer(track) {
            const widget = document.querySelector('.currently-playing');
            
            if (!track) {
                if (widget) widget.style.display = 'none';
                return;
            }
        
            const { title, artist, albumUrl, spotifyUrl } = track;
            
            if (title !== playerState.currentTrack.title || 
                artist !== playerState.currentTrack.artist) {
                
                this.elements.songTitle.textContent = title;
                this.elements.artistName.textContent = artist;
                this.elements.albumImage.src = albumUrl;
                document.getElementById('spotify-link').href = spotifyUrl;
                
                if (widget) widget.style.display = 'flex';
        
                playerState.currentTrack = { title, artist, albumUrl, spotifyUrl };
                playerState.hasPlayedOnce = true;
            }
        }
    };

    // Initialize Spotify updates
    async function updateSpotifyTrack() {
        const track = await spotifyAPI.getRecentTrack();
        UI.updatePlayer(track);
    }

    // Initial load
    updateSpotifyTrack();

    // Set up intervals for token refresh and track updates
    setInterval(() => spotifyAPI.refreshToken(), 3000 * 1000); // 50 minutes
    setInterval(updateSpotifyTrack, 100000); // 100 seconds
});
