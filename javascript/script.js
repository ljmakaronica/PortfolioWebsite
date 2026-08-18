
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
// MORE PROJECTS TOGGLE
// ===============================
const moreProjectsToggle = document.getElementById('more-projects-toggle');
const moreProjectsList = document.getElementById('more-projects-list');
const moreProjectsText = moreProjectsToggle?.querySelector('.more-projects-toggle-text');

if (moreProjectsToggle && moreProjectsList) {
    moreProjectsToggle.addEventListener('click', () => {
        const isExpanded = moreProjectsList.classList.contains('visible');
        moreProjectsList.classList.toggle('visible');
        moreProjectsToggle.classList.toggle('expanded');
        moreProjectsText.textContent = isExpanded ? 'More Projects' : 'Less Projects';
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

// UI Elements (updates both desktop and mobile elements)
const spotifyUI = {
    updateElements(id, content, attr = 'textContent') {
        const desktopEl = document.getElementById(id);
        const mobileEl = document.getElementById(`${id}-mobile`);
        if (desktopEl) {
            if (attr === 'textContent') desktopEl.textContent = content;
            else desktopEl[attr] = content;
        }
        if (mobileEl) {
            if (attr === 'textContent') mobileEl.textContent = content;
            else mobileEl[attr] = content;
        }
    },

    setDisplay(id, display) {
        const desktopEl = document.getElementById(id);
        const mobileEl = document.getElementById(`${id}-mobile`);
        if (desktopEl) desktopEl.style.display = display;
        if (mobileEl) mobileEl.style.display = display;
    },

    updatePlayer(track) {
        if (!track) return;
        const { title, artist, albumUrl, spotifyUrl } = track;
        if (title !== playerState.currentTrack.title ||
            artist !== playerState.currentTrack.artist) {
            
            this.updateElements('song-title', title);
            this.updateElements('artist-name', artist);
            this.updateElements('album-image', albumUrl, 'src');
            this.updateElements('spotify-link', spotifyUrl, 'href');
            this.setDisplay('album-image', '');
            
            playerState.currentTrack = { title, artist, albumUrl, spotifyUrl };
        }
    },

    showUnavailable() {
        this.updateElements('song-title', 'Unavailable');
        this.updateElements('artist-name', 'Spotify');
        this.setDisplay('album-image', 'none');
    }
};

// Track whether the refresh token is expired to stop polling
let spotifyDisabled = false;

// Spotify API Functions (server handles caching)
async function getRecentTrack() {
    if (spotifyDisabled) return null;

    try {
        const response = await fetch('/api/spotify?action=recent');
        if (response.status === 429) {
            const retryAfter = response.headers.get('X-RateLimit-Reset');
            console.warn(`Rate limited. Try again after ${new Date(parseInt(retryAfter))}`);
            return null;
        }
        if (response.status === 401) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.error === 'REFRESH_TOKEN_EXPIRED') {
                console.warn('Spotify refresh token expired. Widget disabled.');
                spotifyDisabled = true;
                spotifyUI.showUnavailable();
                return null;
            }
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
    if (track) {
        spotifyUI.updatePlayer(track);
    }
}

// Initialize Spotify widget
updateSpotifyTrack();

// Refresh when returning to tab
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !spotifyDisabled) {
        updateSpotifyTrack();
    }
});

// Refresh every 30s if tab is active
const updateInterval = setInterval(() => {
    if (!document.hidden && !spotifyDisabled) {
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
