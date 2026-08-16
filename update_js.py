with open("javascript/script.js", "r") as f:
    js = f.read()

# Replace the UIElements block for spotify
old_ui = """
const UIElements = {
    songTitle: document.getElementById('song-title'),
    artistName: document.getElementById('artist-name'),
    albumImage: document.getElementById('album-image'),
    spotifyLink: document.getElementById('spotify-link'),

    updatePlayer(track) {
        if (!track) return;
        const { title, artist, albumUrl, spotifyUrl } = track;
        if (title !== playerState.currentTrack.title ||
            artist !== playerState.currentTrack.artist) {
            if (this.songTitle) this.songTitle.textContent = title;
            if (this.artistName) this.artistName.textContent = artist;
            if (this.albumImage) this.albumImage.src = albumUrl;
            if (this.spotifyLink) this.spotifyLink.href = spotifyUrl;
            playerState.currentTrack = { title, artist, albumUrl, spotifyUrl };
        }
    },

    showUnavailable() {
        if (this.songTitle) this.songTitle.textContent = 'Unavailable';
        if (this.artistName) this.artistName.textContent = 'Spotify';
        if (this.albumImage) this.albumImage.style.display = 'none';
    }
};
"""

new_ui = """
const UIElements = {
    updateElements(id, content, attr='textContent') {
        const el1 = document.getElementById(id);
        const el2 = document.getElementById(id + '-mobile');
        if (el1) { if (attr === 'textContent') el1.textContent = content; else el1[attr] = content; }
        if (el2) { if (attr === 'textContent') el2.textContent = content; else el2[attr] = content; }
    },
    
    setDisplay(id, display) {
        const el1 = document.getElementById(id);
        const el2 = document.getElementById(id + '-mobile');
        if (el1) el1.style.display = display;
        if (el2) el2.style.display = display;
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
            
            playerState.currentTrack = { title, artist, albumUrl, spotifyUrl };
        }
    },

    showUnavailable() {
        this.updateElements('song-title', 'Unavailable');
        this.updateElements('artist-name', 'Spotify');
        this.setDisplay('album-image', 'none');
    }
};
"""
js = js.replace(old_ui.strip(), new_ui.strip())

with open("javascript/script.js", "w") as f:
    f.write(js)
