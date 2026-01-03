// Inline Stem Player mute toggle
const stemPlayerVideo = document.getElementById('stem-player-video');
const stemPlayerMuteToggle = document.getElementById('stem-player-mute-toggle');

if (stemPlayerVideo && stemPlayerMuteToggle) {
    stemPlayerVideo.muted = true;
    stemPlayerMuteToggle.classList.remove('unmuted');

    stemPlayerMuteToggle.addEventListener('click', () => {
        stemPlayerVideo.muted = !stemPlayerVideo.muted;
        if (stemPlayerVideo.muted) {
            stemPlayerMuteToggle.classList.remove('unmuted');
        } else {
            stemPlayerMuteToggle.classList.add('unmuted');
        }
    });
}

// ===============================
// SPOTIFY WIDGET
// ===============================

// Spotify Player State
const playerState = {
    currentTrack: {
        title: '',
        artist: '',
        albumUrl: '',
        spotifyUrl: ''
    }
};

const REFRESH_INTERVAL = 30 * 1000; // 30 seconds

// UI Elements
const spotifyUI = {
    songTitle: document.getElementById('song-title'),
    artistName: document.getElementById('artist-name'),
    albumImage: document.getElementById('album-image'),
    spotifyLink: document.getElementById('spotify-link'),

    updatePlayer(track) {
        if (!track) return;
        const { title, artist, albumUrl, spotifyUrl } = track;
        if (title !== playerState.currentTrack.title ||
            artist !== playerState.currentTrack.artist) {
            this.songTitle.textContent = title;
            this.artistName.textContent = artist;
            this.albumImage.src = albumUrl;
            this.spotifyLink.href = spotifyUrl;
            playerState.currentTrack = { title, artist, albumUrl, spotifyUrl };
        }
    }
};

// Spotify API Functions (server handles caching)
async function getRecentTrack() {
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

async function updateSpotifyTrack() {
    const track = await getRecentTrack();
    spotifyUI.updatePlayer(track);
}

// Initialize Spotify widget
updateSpotifyTrack();

// Refresh when returning to tab
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        updateSpotifyTrack();
    }
});

// Refresh every 5 mins if tab is active
const updateInterval = setInterval(() => {
    if (!document.hidden) {
        updateSpotifyTrack();
    }
}, REFRESH_INTERVAL);

// Cleanup interval on page unload
window.addEventListener('unload', () => {
    clearInterval(updateInterval);
});

// ===============================
// THEME TOGGLE
// ===============================
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('i');

// Check for saved theme preference or system preference
const savedTheme = localStorage.getItem('theme');
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeIcon.classList.remove('fa-moon');
    themeIcon.classList.add('fa-sun');
}

// Toggle theme
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');

    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
});
