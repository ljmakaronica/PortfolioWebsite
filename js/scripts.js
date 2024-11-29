document.addEventListener('DOMContentLoaded', () => {
    const playerState = {
        currentTrack: {
            title: '',
            artist: '',
            albumUrl: ''
        },
        hasPlayedOnce: false
    };

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

    async function getRecentTrack() {
        try {
            const response = await fetch('/api/spotify?action=recent');
            if (!response.ok) throw new Error('API request failed');
            
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
        } catch (error) {
            console.error('Error fetching track:', error);
        }
        return null;
    }

    // Initialize Spotify updates
    async function updateSpotifyTrack() {
        const track = await getRecentTrack();
        UI.updatePlayer(track);
    }

    // Initial load
    updateSpotifyTrack();

    // Update track every 100 seconds
    setInterval(updateSpotifyTrack, 100000);
});
