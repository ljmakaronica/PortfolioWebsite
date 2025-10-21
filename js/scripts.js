document.addEventListener('DOMContentLoaded', () => {
    // ===== SPOTIFY PLAYER =====
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
  
    // Initialize Spotify
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

    // ===== VIDEO AUDIO CONTROL =====
    const stemPlayerVideo = document.getElementById('stem-player-video');
    const audioToggle = document.getElementById('audio-toggle');
    let isAudioMuted = true;

    if (stemPlayerVideo && audioToggle) {
        // Start muted
        stemPlayerVideo.muted = true;
        
        audioToggle.addEventListener('click', () => {
            isAudioMuted = !isAudioMuted;
            stemPlayerVideo.muted = isAudioMuted;
            
            // Update icon
            const icon = audioToggle.querySelector('i');
            if (isAudioMuted) {
                icon.className = 'fas fa-volume-mute';
            } else {
                icon.className = 'fas fa-volume-up';
            }
        });
    }

    // ===== PROJECT SHOWCASE FUNCTIONALITY =====
    const projects = document.querySelectorAll('.project[data-project]');
    const projectShowcase = document.querySelector('.project-showcase');
    const closeShowcaseBtn = document.querySelector('.close-showcase');
    const showcaseTitle = document.getElementById('showcase-title');
    const showcaseDescription = document.getElementById('showcase-description');
    const showcaseLinks = document.querySelector('.showcase-links');
    const mediaContainers = document.querySelectorAll('.media-container');

    let currentProjectId = null;
    let screenshotInterval = null;

    // Project data
    const projectData = {
        'serbdictionary': {
            title: 'serbDictionary',
            description: 'iOS app translating Serbian ↔ English. Includes search, example sentences, and word-of-the-day widget.'
        },
        'stem-player': {
            title: 'iOS Stem Player',
            description: 'Audio separation and playback tool leveraging ML-based Demucs model.'
        },
        'forex': {
            title: 'Forex Platform',
            description: 'Predictive FX trading web app. 3rd Place — Northern Trust Hackathon.'
        },
        'nba': {
            title: 'NBA Schedule',
            description: 'Web app displaying real-time NBA scores and schedules.'
        },
        'food-waste': {
            title: 'Food Waste Prevention Platform',
            description: 'React website connecting restaurants to customers for last-minute purchases. Features AI food analysis and SupaBase backend.'
        }
    };

    function openShowcase(projectId, project) {
        // If already viewing this project, don't reopen
        if (currentProjectId === projectId) return;

        // Add project-active class to container
        document.getElementById('main-container').classList.add('project-active');

        // Pause and mute stem player video if switching projects
        if (stemPlayerVideo) {
            stemPlayerVideo.pause();
            stemPlayerVideo.muted = true;
            isAudioMuted = true;
            const icon = audioToggle?.querySelector('i');
            if (icon) icon.className = 'fas fa-volume-mute';
        }

        currentProjectId = projectId;

        // Stop any existing cycles and reset ALL screenshots first
        stopScreenshotCycle();
        mediaContainers.forEach(container => {
            container.classList.remove('active');
            container.querySelectorAll('.screenshot-display').forEach(display => {
                display.classList.remove('active');
            });
        });

        // Show showcase
        projectShowcase.style.display = 'flex';

        // Update header
        const data = projectData[projectId];
        showcaseTitle.textContent = data.title;
        showcaseDescription.textContent = data.description;

        // Show correct media container
        const activeContainer = document.querySelector(`.media-container[data-project="${projectId}"]`);
        if (activeContainer) {
            activeContainer.classList.add('active');
            
            // Start screenshot cycling for this project (except stem-player which is video)
            if (projectId !== 'stem-player') {
                startScreenshotCycle(activeContainer);
            } else {
                // For stem-player, show the video and play it
                const videoDisplay = activeContainer.querySelector('.screenshot-display');
                if (videoDisplay) videoDisplay.classList.add('active');
                if (stemPlayerVideo) {
                    stemPlayerVideo.currentTime = 0; // Restart from beginning
                    stemPlayerVideo.play();
                }
            }
        }

        // Update links
        showcaseLinks.innerHTML = '';
        
        if (project.dataset.github) {
            const githubBtn = document.createElement('a');
            githubBtn.href = project.dataset.github;
            githubBtn.target = '_blank';
            githubBtn.className = 'btn';
            githubBtn.innerHTML = '<i class="fab fa-github"></i> View on GitHub';
            showcaseLinks.appendChild(githubBtn);
        }

        if (project.dataset.appstore) {
            const appstoreBtn = document.createElement('a');
            appstoreBtn.href = project.dataset.appstore;
            appstoreBtn.target = '_blank';
            appstoreBtn.className = 'btn-accent';
            appstoreBtn.innerHTML = '<i class="fab fa-apple"></i> Download on the App Store';
            showcaseLinks.appendChild(appstoreBtn);
        }

        if (project.dataset.website) {
            const websiteBtn = document.createElement('a');
            websiteBtn.href = project.dataset.website;
            websiteBtn.target = '_blank';
            websiteBtn.className = 'btn-accent';
            websiteBtn.innerHTML = '<i class="fas fa-external-link-alt"></i> Visit Website';
            showcaseLinks.appendChild(websiteBtn);
        }

        // Highlight active project
        projects.forEach(p => p.classList.remove('active'));
        project.classList.add('active');
    }

    function closeShowcase() {
        // Remove project-active class from container
        document.getElementById('main-container').classList.remove('project-active');

        // Stop screenshot cycling
        stopScreenshotCycle();

        // Pause and mute stem player video
        if (stemPlayerVideo) {
            stemPlayerVideo.pause();
            stemPlayerVideo.muted = true;
            isAudioMuted = true;
            const icon = audioToggle?.querySelector('i');
            if (icon) icon.className = 'fas fa-volume-mute';
        }

        // Hide showcase
        projectShowcase.style.display = 'none';

        // Clear active states
        projects.forEach(p => p.classList.remove('active'));
        mediaContainers.forEach(container => {
            container.classList.remove('active');
            // Reset all screenshots
            container.querySelectorAll('.screenshot-display').forEach(display => {
                display.classList.remove('active');
            });
        });

        currentProjectId = null;
    }

    function startScreenshotCycle(container) {
        stopScreenshotCycle(); // Clear any existing interval

        const screenshots = container.querySelectorAll('.screenshot-display');
        
        // Always show the first screenshot
        if (screenshots.length > 0) {
            screenshots[0].classList.add('active');
        }
        
        if (screenshots.length <= 1) return; // No need to cycle if only 1 screenshot

        let currentIndex = 0;

        screenshotInterval = setInterval(() => {
            screenshots[currentIndex].classList.remove('active');
            currentIndex = (currentIndex + 1) % screenshots.length;
            screenshots[currentIndex].classList.add('active');
        }, 3000); // Change every 3 seconds
    }

    function stopScreenshotCycle() {
        if (screenshotInterval) {
            clearInterval(screenshotInterval);
            screenshotInterval = null;
        }
    }

    // Project click handlers
    projects.forEach(project => {
        project.addEventListener('click', () => {
            const projectId = project.dataset.project;
            openShowcase(projectId, project);
        });
    });

    // Close button
    closeShowcaseBtn.addEventListener('click', closeShowcase);

    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentProjectId) {
            closeShowcase();
        }
    });

    // Stop cycling when page is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopScreenshotCycle();
            // Pause video if it's playing
            if (stemPlayerVideo && !stemPlayerVideo.paused) {
                stemPlayerVideo.pause();
            }
        } else if (currentProjectId && currentProjectId !== 'stem-player') {
            const activeContainer = document.querySelector(`.media-container[data-project="${currentProjectId}"]`);
            if (activeContainer) {
                startScreenshotCycle(activeContainer);
            }
        } else if (currentProjectId === 'stem-player' && stemPlayerVideo) {
            // Resume video if stem-player is active
            stemPlayerVideo.play();
        }
    });
});