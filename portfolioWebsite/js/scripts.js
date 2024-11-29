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
                            spotifyUrl: track.external_urls.spotify  // Add this line
                        };
                    }
                }
            } catch (error) {
                console.error('Error fetching track:', error);
            }
            return null;
        }
    };

    // UI and Animation handlers
    const UI = {
        elements: {
            songTitle: document.getElementById('song-title'),
            artistName: document.getElementById('artist-name'),
            albumImage: document.getElementById('album-image'),
            nav: document.querySelector('.nav-wrapper'),
            scrollContainer: document.querySelector('.scroll-container'),
            sections: document.querySelectorAll('section'),
            parallaxBgs: document.querySelectorAll('.parallax-bg'),
            projectBgs: document.querySelectorAll('.project-bg'),
            animatedElements: document.querySelectorAll('.project-content, .about-content, .contact-content')
        },

        updatePlayer(track) {
            if (!track) return;
        
            const { title, artist, albumUrl, spotifyUrl } = track;
            
            if (title !== playerState.currentTrack.title || 
                artist !== playerState.currentTrack.artist) {
                
                this.elements.songTitle.textContent = title;
                this.elements.artistName.textContent = artist;
                this.elements.albumImage.src = albumUrl;
                document.getElementById('spotify-link').href = spotifyUrl;  // Add this line
        
                playerState.currentTrack = { title, artist, albumUrl, spotifyUrl };
                playerState.hasPlayedOnce = true;
            }
        },

        // Initialize intersection observer for smooth animations
        initObservers() {
            const options = {
                threshold: 0.15, // Reduced threshold for earlier trigger
                rootMargin: '0px'
            };

            // Add animate class to all elements that should animate
            this.elements.animatedElements.forEach(element => {
                element.classList.add('animate');
            });

            const animationObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        // Keep the animation visible
                        animationObserver.unobserve(entry.target);
                    }
                });
            }, options);

            this.elements.animatedElements.forEach(element => {
                animationObserver.observe(element);
            });
        },

        // Modified parallax effect for smoother scrolling
        handleParallax() {
            const scrolled = window.scrollY;
            
            // Smooth parallax for background elements
            this.elements.parallaxBgs.forEach(bg => {
                const speed = 0.15; // Reduced speed for subtler effect
                const yPos = -(scrolled * speed);
                bg.style.transform = `translate3d(0, ${yPos}px, -1px) scale(1.1)`;
            });

            // Gentler project background parallax
            this.elements.projectBgs.forEach(bg => {
                const rect = bg.parentElement.getBoundingClientRect();
                const speed = 0.08; // Reduced speed
                const yPos = (rect.top * speed);
                bg.style.transform = `translate3d(0, ${yPos}px, -1px)`;
            });

            // Smoother content parallax
            this.elements.sections.forEach(section => {
                const rect = section.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
                
                if (progress > 0 && progress < 1) {
                    const content = section.querySelector('.project-content, .about-content, .contact-content');
                    if (content) {
                        const speed = 0.02; // Very subtle movement
                        const yPos = (rect.top * speed);
                        content.style.transform = `translate3d(0, ${yPos}px, 0)`;
                        content.style.opacity = Math.min(1, Math.max(0, progress * 1.5));
                    }
                }
            });
        },

        // Enhanced scroll handler for smoother transitions
        handleScroll() {
            const scrolled = window.scrollY;
            
            // Smooth navigation opacity
            const scrollPercent = Math.min(scrolled / 500, 0.8);
            this.elements.nav.style.backgroundColor = `rgba(0, 0, 0, ${scrollPercent})`;
            
            // Update parallax effects with smooth transitions
            this.handleParallax();

            // Request next frame for smooth animations
            requestAnimationFrame(() => {
                this.elements.sections.forEach(section => {
                    const rect = section.getBoundingClientRect();
                    const progress = -rect.top / rect.height;
                    
                    if (progress >= 0 && progress <= 1) {
                        section.style.opacity = 1;
                    }
                });
            });
        }
    };

    // Enhanced scroll handling with better performance
    let lastKnownScrollPosition = 0;
    let ticking = false;

    window.addEventListener('scroll', () => {
        lastKnownScrollPosition = window.scrollY;

        if (!ticking) {
            window.requestAnimationFrame(() => {
                UI.handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Smooth scrolling for navigation with enhanced behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 0; // Remove offset for full-screen sections
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Initialize
    UI.initObservers();
    
    // Initialize Spotify updates
    async function updateSpotifyTrack() {
        const track = await spotifyAPI.getRecentTrack();
        UI.updatePlayer(track);
    }

    // Initial load
    updateSpotifyTrack();
    UI.handleScroll();

    // Set up intervals
    setInterval(() => spotifyAPI.refreshToken(), 3000 * 1000); // 50 minutes
    setInterval(updateSpotifyTrack, 100000); // 100 seconds

    // Add resize handler for responsive updates
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            UI.handleScroll();
        }, 100);
    });
});
