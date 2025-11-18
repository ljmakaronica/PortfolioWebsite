// Project data
const projects = [
    {
        title: "serbDictionary",
        description: "iOS app translating Serbian ↔ English with 100,000+ words. Features include search, example sentences, favorites, and a word-of-the-day widget. Built natively with SwiftUI and optimized for offline use with SQLite.",
        techStack: ["SwiftUI", "SQLite", "WidgetKit"],
        githubLink: "https://github.com/ljmakaronica/serbDictionaryiOSApp",
        liveLink: "https://apps.apple.com/us/app/serbdictionary/id6753670428",
        images: [
            "assets/images/project-images/serbdictionary/IMG_8739.png",
            "assets/images/project-images/serbdictionary/IMG_8740.png",
            "assets/images/project-images/serbdictionary/IMG_8741.png",
            "assets/images/project-images/serbdictionary/IMG_8742.png"
        ]
    },
    {
        title: "iOS Stem Player",
        description: "Audio separation and playback tool leveraging the ML-based Demucs model. Upload songs and isolate vocals, drums, bass, and other instruments. Built with Swift frontend connected to Python/Flask backend for ML processing.",
        techStack: ["Swift", "Python", "Flask", "ML"],
        githubLink: "https://github.com/ljmakaronica/iOS-Stem-Player",
        liveLink: "",
        video: "assets/images/project-images/stemplayer/stem.mp4",
        images: []
    },
    {
        title: "Forex Platform",
        description: "Predictive foreign exchange trading web app using LSTM neural networks. Features real-time currency data visualization and ML-based price predictions. Awarded 3rd Place at the Northern Trust Hackathon.",
        techStack: ["React", "Python", "LSTM"],
        githubLink: "https://github.com/RichardLechko/depaul-northern-trust-hackathon",
        liveLink: "https://depaul-northern-trust-hackathon.vercel.app",
        images: [
            "assets/images/project-images/forex/forex1.png",
            "assets/images/project-images/forex/forex2.png",
            "assets/images/project-images/forex/forex3.png"
        ]
    },
    {
        title: "NBA Schedule",
        description: "Web app displaying real-time NBA scores and schedules for the 2024-25 season. Clean interface with live updates fetched from the NBA API.",
        techStack: ["HTML/CSS", "JavaScript", "API"],
        githubLink: "https://github.com/ljmakaronica/NBAScoresWebsite",
        liveLink: "https://2024-25-nba-scores.vercel.app",
        images: [
            "assets/images/project-images/nbaschedule/nbascreenshot.png",
            "assets/images/project-images/nbaschedule/nbascreenshot2.png"
        ]
    },
    {
        title: "NowOrNever",
        description: "React web app connecting restaurants to customers for last-minute food purchases, reducing food waste. Features AI-powered food image analysis and real-time inventory management with Supabase backend.",
        techStack: ["React", "AI", "Supabase"],
        githubLink: "https://github.com/RichardLechko/IIT-Hackathon",
        liveLink: "https://iit-hackathon.vercel.app",
        images: [
            "assets/images/project-images/nowornever/nowornever1.png",
            "assets/images/project-images/nowornever/nowornever2.png",
            "assets/images/project-images/nowornever/nowornever3.png",
            "assets/images/project-images/nowornever/nowornever4.png"
        ]
    }
];

// State
let currentProject = null;
let currentImageIndex = 0;
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
const carousel = document.querySelector('.carousel');
const carouselImage = document.getElementById('carousel-image');
const carouselVideo = document.getElementById('carousel-video');
const videoMuteToggle = document.getElementById('video-mute-toggle');
const carouselDots = document.getElementById('carousel-dots');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// Open project detail view
function openProject(projectIndex) {
    // If clicking the same project, close it
    if (currentProject === projectIndex) {
        closeProject();
        return;
    }

    currentProject = projectIndex;
    currentImageIndex = 0;

    const project = projects[projectIndex];

    // Update project details
    projectTitle.textContent = project.title;
    projectDescription.textContent = project.description;
    githubLink.href = project.githubLink;
    liveLink.href = project.liveLink;

    // Update tech tags
    projectTechTags.innerHTML = '';
    project.techStack.forEach(tech => {
        const tag = document.createElement('span');
        tag.className = 'tech-tag';
        tag.textContent = tech;
        projectTechTags.appendChild(tag);
    });

    // Setup carousel (check for video or images)
    if (project.video) {
        setupVideo(project.video);
    } else {
        setupCarousel(project.images);
    }

    // Add phone-style carousel for projects 1 & 2 (index 0 & 1)
    if (projectIndex === 0 || projectIndex === 1) {
        carousel.classList.add('phone-carousel');
    } else {
        carousel.classList.remove('phone-carousel');
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
}

// Close project detail view
function closeProject() {
    currentProject = null;
    currentImageIndex = 0;

    // Stop video if playing
    carouselVideo.pause();
    carouselVideo.currentTime = 0;

    // Remove active state from all cards
    projectCards.forEach(card => {
        card.classList.remove('active');
    });

    // Show profile view, hide project
    projectView.classList.remove('active');
    profileView.classList.add('active');

    // Restore scroll position after a brief delay to ensure DOM has updated
    setTimeout(() => {
        window.scrollTo(0, savedScrollPosition);
    }, 0);
}

// Setup video
function setupVideo(videoSrc) {
    // Hide image, show video
    carouselImage.style.display = 'none';
    carouselVideo.style.display = 'block';
    videoMuteToggle.style.display = 'flex';

    // Set video source and enable audio
    carouselVideo.querySelector('source').src = videoSrc;
    carouselVideo.muted = true; // Start muted
    carouselVideo.load();
    carouselVideo.play();

    // Update mute button state
    videoMuteToggle.classList.remove('unmuted');

    // Hide navigation and dots
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    carouselDots.innerHTML = '';
}

// Setup carousel
function setupCarousel(images) {
    // Hide video and mute toggle, show image
    carouselVideo.style.display = 'none';
    carouselVideo.pause();
    videoMuteToggle.style.display = 'none';
    carouselImage.style.display = 'block';

    // Set first image
    carouselImage.src = images[0];

    // Create dots
    carouselDots.innerHTML = '';
    images.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'carousel-dot';
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToImage(index));
        carouselDots.appendChild(dot);
    });

    // Hide navigation if only one image
    if (images.length === 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
    }
}

// Go to specific image
function goToImage(index) {
    if (currentProject === null) return;

    const images = projects[currentProject].images;
    currentImageIndex = index;
    carouselImage.src = images[index];

    // Update dots
    const dots = carouselDots.querySelectorAll('.carousel-dot');
    dots.forEach((dot, i) => {
        if (i === index) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Next image
function nextImage() {
    if (currentProject === null) return;

    const images = projects[currentProject].images;
    currentImageIndex = (currentImageIndex + 1) % images.length;
    goToImage(currentImageIndex);
}

// Previous image
function prevImage() {
    if (currentProject === null) return;

    const images = projects[currentProject].images;
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    goToImage(currentImageIndex);
}

// Event Listeners
projectCards.forEach((card, index) => {
    card.addEventListener('click', () => openProject(index));
});

closeBtn.addEventListener('click', closeProject);
prevBtn.addEventListener('click', prevImage);
nextBtn.addEventListener('click', nextImage);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (currentProject === null) return;

    if (e.key === 'Escape') {
        closeProject();
    } else if (e.key === 'ArrowLeft') {
        prevImage();
    } else if (e.key === 'ArrowRight') {
        nextImage();
    }
});

// Video mute toggle
videoMuteToggle.addEventListener('click', () => {
    carouselVideo.muted = !carouselVideo.muted;
    if (carouselVideo.muted) {
        videoMuteToggle.classList.remove('unmuted');
    } else {
        videoMuteToggle.classList.add('unmuted');
    }
});

// Touch/Swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

const carouselContainer = document.querySelector('.carousel-container');

carouselContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

carouselContainer.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const swipeThreshold = 50; // Minimum distance for a swipe
    const horizontalDiff = touchStartX - touchEndX;
    const verticalDiff = Math.abs(touchStartY - touchEndY);

    // Only trigger if horizontal swipe is more significant than vertical
    if (Math.abs(horizontalDiff) > swipeThreshold && Math.abs(horizontalDiff) > verticalDiff) {
        if (horizontalDiff > 0) {
            // Swiped left - go to next image
            nextImage();
        } else {
            // Swiped right - go to previous image
            prevImage();
        }
    }
}

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

