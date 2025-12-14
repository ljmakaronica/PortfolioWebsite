// Project data
const projects = [
    {
        title: "serbDictionary",
        description: "iOS app translating Serbian ↔ English with 100,000+ words. Features include search, example sentences, and a word-of-the-day widget. Built natively with SwiftUI and optimized for offline use with SQLite.",
        techStack: ["SwiftUI", "SQLite", "WidgetKit"],
        githubLink: "https://github.com/ljmakaronica/serbDictionaryiOSApp",
        liveLink: "https://apps.apple.com/us/app/serbdictionary/id6753670428",
        video: "assets/images/project-images/serbdictionary/serb.mp4",
        images: []
    },
    {
        title: "iOS Stem Player",
        description: "Audio separation and playback tool leveraging the ML-based Demucs model. Upload songs and isolate vocals, drums, bass, and other instruments. Built with Swift frontend connected to Python/Flask backend for ML processing.",
        techStack: ["Swift", "Python", "Flask", "Demucs", "ML"],
        githubLink: "https://github.com/ljmakaronica/iOS-Stem-Player",
        liveLink: "",
        video: "assets/images/project-images/stemplayer/stem.mp4",
        images: []
    },
    {
        title: "Forex Platform",
        description: "<b>Awarded 3rd Place at the Northern Trust x DePaul Hackathon.</b> Predictive foreign exchange trading web app using LSTM neural networks. Features real-time currency data visualization and ML-based price predictions.",
        techStack: ["React", "Python", "LSTM"],
        githubLink: "https://github.com/RichardLechko/depaul-northern-trust-hackathon",
        liveLink: "https://depaul-northern-trust-hackathon.vercel.app",
        images: [
            "assets/images/project-images/forex/forex1.webp"
        ]
    },
    {
        title: "NBA Schedule",
        description: "Web app displaying real-time NBA scores and schedules for the 2025-26 season. Also has game box scores and conference standings. Clean interface with live updates fetched from ESPN.",
        techStack: ["HTML/CSS", "JavaScript", "API"],
        githubLink: "https://github.com/ljmakaronica/NBAScoresWebsite",
        liveLink: "https://nba2026.vercel.app",
        video: "assets/images/project-images/nbaschedule/nba.mp4",
        videoMobile: "assets/images/project-images/nbaschedule/nbaMOBILE.mp4",
        images: []
    },
    {
        title: "NowOrNever",
        description: "React web app connecting restaurants to customers for last-minute food purchases, reducing food waste. Features AI-powered food image analysis and real-time inventory management with Supabase backend.",
        techStack: ["React", "AI", "Supabase"],
        githubLink: "https://github.com/RichardLechko/IIT-Hackathon",
        liveLink: "https://iit-hackathon.vercel.app",
        images: [
            "assets/images/project-images/nowornever/nowornever1.png"
        ]
    }
];

// State
let currentProject = null;
let savedScrollPosition = 0;

// DOM Elements
const profileView = document.getElementById('profile-view');
const projectView = document.getElementById('project-view');
const projectCards = document.querySelectorAll('.project-card');
const closeBtn = document.getElementById('close-project');

// Project detail elements
const projectTitle = document.getElementById('project-title');
const projectDescription = document.getElementById('project-description');
const projectTechTags = document.getElementById('project-tech-tags');
const githubLink = document.getElementById('github-link');
const liveLink = document.getElementById('live-link');
const projectMedia = document.querySelector('.project-media');
const projectImage = document.getElementById('project-image');
const projectVideo = document.getElementById('project-video');
const videoMuteToggle = document.getElementById('video-mute-toggle');
const loadingOverlay = document.querySelector('.media-loading-overlay');

// Open project detail view
function openProject(projectIndex) {
    // If clicking the same project, close it
    if (currentProject === projectIndex) {
        closeProject();
        return;
    }

    currentProject = projectIndex;

    const project = projects[projectIndex];

    // Update project details
    projectTitle.textContent = project.title;
    projectDescription.innerHTML = project.description;
    githubLink.href = project.githubLink;

    // Handle live link button
    if (project.liveLink) {
        liveLink.href = project.liveLink;
        liveLink.style.display = 'inline-block';

        // Special case for serbDictionary (App Store link)
        if (projectIndex === 0) {
            liveLink.innerHTML = '<i class="fab fa-apple"></i> App Store';
        } else {
            liveLink.textContent = 'Visit Website';
        }
    } else {
        liveLink.style.display = 'none';
    }

    // Update tech tags
    projectTechTags.innerHTML = '';
    project.techStack.forEach(tech => {
        const tag = document.createElement('span');
        tag.className = 'tech-tag';
        tag.textContent = tech;
        projectTechTags.appendChild(tag);
    });

    // Setup media (check for video or images)
    // Check if mobile (width < 768px) and if mobile video exists
    const isMobile = window.innerWidth < 768;
    let videoSrc = project.video;
    let usePhoneMedia = false;

    if (isMobile && project.videoMobile) {
        videoSrc = project.videoMobile;
        usePhoneMedia = true;
    }

    if (videoSrc) {
        setupVideo(videoSrc);
    } else {
        setupImage(project.images[0]);
    }

    // Add phone-style media for projects 1 & 2 (index 0 & 1) OR if using mobile video
    if (projectIndex === 0 || projectIndex === 1 || usePhoneMedia) {
        projectMedia.classList.add('phone-media');
    } else {
        projectMedia.classList.remove('phone-media');
    }

    // Update active state on cards
    projectCards.forEach((card, index) => {
        if (index === projectIndex) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

    // Save scroll position before hiding profile view
    savedScrollPosition = window.scrollY || document.documentElement.scrollTop;

    // Show project view, hide profile
    profileView.classList.remove('active');
    projectView.classList.add('active');

    // Lock body scroll
    document.body.style.overflow = 'hidden';
}

// Close project detail view
function closeProject() {
    currentProject = null;

    // Stop video if playing
    projectVideo.pause();
    projectVideo.currentTime = 0;

    // Remove active state from all cards
    projectCards.forEach(card => {
        card.classList.remove('active');
    });

    // Show profile view, hide project
    projectView.classList.remove('active');
    profileView.classList.add('active');

    // Unlock body scroll
    document.body.style.overflow = '';

    // Restore scroll position after a brief delay to ensure DOM has updated
    setTimeout(() => {
        window.scrollTo(0, savedScrollPosition);
    }, 0);
}

// Setup video
function setupVideo(videoSrc) {
    // Show loading overlay
    loadingOverlay.classList.remove('hidden');
    projectVideo.classList.remove('loaded');

    // Hide image, show video
    projectImage.style.display = 'none';
    projectVideo.style.display = 'block';

    // Only show mute toggle for Stem Player (index 1)
    if (currentProject === 1) {
        videoMuteToggle.style.display = 'flex';
    } else {
        videoMuteToggle.style.display = 'none';
    }

    // Set video source and enable audio
    projectVideo.querySelector('source').src = videoSrc;
    projectVideo.muted = true; // Start muted

    // Hide loading overlay when video is ready
    projectVideo.addEventListener('loadeddata', function onVideoLoaded() {
        loadingOverlay.classList.add('hidden');
        projectVideo.classList.add('loaded');
        projectVideo.play();
        projectVideo.removeEventListener('loadeddata', onVideoLoaded);
    }, { once: true });

    projectVideo.load();

    // Update mute button state
    videoMuteToggle.classList.remove('unmuted');
}

// Setup single image
function setupImage(imageSrc) {
    // Show loading overlay
    loadingOverlay.classList.remove('hidden');
    projectImage.classList.remove('loaded');

    // Hide video and mute toggle, show image
    projectVideo.style.display = 'none';
    projectVideo.pause();
    videoMuteToggle.style.display = 'none';
    projectImage.style.display = 'block';

    // Hide loading overlay when image is loaded
    projectImage.addEventListener('load', function onImageLoaded() {
        loadingOverlay.classList.add('hidden');
        projectImage.classList.add('loaded');
        projectImage.removeEventListener('load', onImageLoaded);
    }, { once: true });

    // Set image
    projectImage.src = imageSrc;
}

// Event Listeners
projectCards.forEach((card, index) => {
    card.addEventListener('click', () => openProject(index));
});

// Prevent link clicks from bubbling up (fixes mobile glitch)
[githubLink, liveLink].forEach(link => {
    link.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});

// Handle serbDictionary link in bio
const serbLink = document.getElementById('serb-link');
if (serbLink) {
    serbLink.addEventListener('click', (e) => {
        e.preventDefault();
        openProject(0);
    });
}

closeBtn.addEventListener('click', closeProject);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (currentProject === null) return;

    if (e.key === 'Escape') {
        closeProject();
    }
});

// Video mute toggle
videoMuteToggle.addEventListener('click', () => {
    // Toggle mute state
    projectVideo.muted = !projectVideo.muted;
    if (projectVideo.muted) {
        videoMuteToggle.classList.remove('unmuted');
    } else {
        videoMuteToggle.classList.add('unmuted');
    }
});

// Initialize - show profile view on load
profileView.classList.add('active');

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
    },
    hasPlayedOnce: false
};

const CACHE_KEY = 'spotify_track_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

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
    spotifyUI.updatePlayer(track);
}

// Initialize Spotify widget
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
