import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update Subtitle and Info Grid
html = html.replace(
    '<p class="subtitle">DePaul Computer Science Alum</p>',
    '<p class="subtitle">Technical Support Engineer @ Adyen</p>'
)

html = re.sub(
    r'<div class="profile-bio">\s*</div>',
    '',
    html
)

html = re.sub(
    r'<span><i class="fas fa-graduation-cap" style="visibility: hidden;"></i> 3\.69 GPA · Cum Laude · Spanish Minor</span>\s*',
    '',
    html
)

# 2. Remove Resume from top CTA
html = re.sub(
    r'<a href="/assets/Marko_Ljuboja_Resume\.pdf"[^>]*>\s*Resume\s*</a>\s*',
    '',
    html
)

# 3. Replace Project Descriptions and remove Tech Tags
replacements = {
    "iOS app translating Serbian ↔ English. Features include search, example sentences, and a word-of-the-day widget. Built natively with SwiftUI and optimized for offline use with SQLite.": "My own dictionary app for translating Serbian to English. Built it natively for iOS so it works fully offline.",
    "Audio separation and playback tool leveraging the ML-based Demucs model. Upload songs and isolate vocals, drums, bass, and other instruments. Built with Swift frontend connected to Python/Flask backend for ML processing.": "Cool little tool to isolate vocals and instruments from any song.",
    "Full-stack web application that converts uploaded resumes into editable, hosted portfolio websites in under 60 seconds. Built and shipped end-to-end, with authentication, Stripe-based subscription billing, and Cloudflare-powered custom subdomain routing.": "I made a site that turns your resume into a portfolio website in under a minute.",
    "<strong>Awarded 3rd Place at the Northern Trust x DePaul Hackathon.</strong> Foreign exchange tradiing platform with real-time currency data visualization, trading simulator, and future view.": "<strong>Awarded 3rd Place at a hackathon.</strong> Foreign exchange trading platform with a simulator and real time data.",
    "Web app displaying real-time NBA scores and schedules for the 2025-26 season. Also has game box scores and conference standings. Clean interface with live updates fetched from ESPN.": "Just a clean interface to check NBA scores and schedules.",
    "React web app made for the IIT ScarletHacks Hackathon. Connects restaurants to customers for last-minute food purchases, reducing food waste. Features AI-powered food image analysis and real-time inventory management with Supabase backend.": "App we built at a hackathon that connects restaurants to people for last minute food purchases to reduce waste.",
    "Stock trading simulator with order book management, buy/sell matching, user portfolio tracking, and a publisher/subscriber pattern for real-time market updates.": "Stock trading simulator with order book management and real time updates.",
    "Modern e-commerce shopping cart with add/remove functionality and real-time updates in a clean, minimalist design.": "Simple e-commerce shopping cart built with clean html.",
    "Poker pre-flop hand selection guide with position-based recommendations for optimal starting hand ranges across different table sizes.": "Pre-flop hand selection guide for poker.",
    "Interactive NFL field goal distance calculator visualizing kicker success rates with drag-and-drop functionality and 2025 season stats for all 32 teams.": "Interactive field goal distance calculator visualizing kicker stats for all 32 NFL teams.",
    "Custom NBA fantasy basketball scoring engine with weighted statistical models, age-based potential analysis, and injury risk assessment.": "Custom NBA fantasy scoring engine.",
    "Lightweight CTA train and bus tracker configured for my own commute. Shows real-time arrival predictions for nearby stations.": "Lightweight tracker showing real time train and bus arrivals for my personal commute."
}

for old, new in replacements.items():
    html = html.replace(old, new)
    
# Remove all project-item-tech blocks
html = re.sub(
    r'<div class="project-item-tech">.*?</div>',
    '',
    html,
    flags=re.DOTALL
)

# 4. Remove Footer CTA entirely
html = re.sub(
    r'<!-- Footer CTA -->\s*<footer class="footer-cta">.*?</footer>\s*',
    '',
    html,
    flags=re.DOTALL
)

# 5. Extract "Lately" widgets, we will place them top-right.
# Let's drop the "footer-widgets-label" as it'll be in the top right.
widgets_html = """
            <!-- Top Right Widgets -->
            <div class="top-right-widgets desktop-only">
                <a href="#" id="spotify-link" target="_blank" class="top-widget">
                    <img id="album-image" src="" alt="Album" class="top-widget-img">
                    <span class="top-widget-text">
                        <span id="song-title">Loading...</span>
                        <span id="artist-name">Spotify</span>
                    </span>
                </a>
                <a id="goodreads-link" href="https://www.goodreads.com/book/show/824279.The_Death_of_Ivan_Ilyich_and_Other_Stories" target="_blank" class="top-widget">
                    <img src="assets/images/ivan.png" id="book-image" alt="Book" class="top-widget-img book">
                    <span class="top-widget-text">
                        <span id="book-title">The Death of Ivan Ilyich</span>
                        <span id="book-author">Leo Tolstoy</span>
                    </span>
                </a>
            </div>
"""

# Place it inside .container, right before main-content for desktop absolute positioning
html = html.replace(
    '<main class="main-content">',
    widgets_html + '\n        <main class="main-content">'
)

# Replace the site-footer content to have the compact links and keep mobile widgets
footer_replacement = """
                <footer class="site-footer">
                    <div class="footer-widgets mobile-only">
                        <a href="#" id="spotify-link-mobile" target="_blank" class="footer-widget">
                            <img id="album-image-mobile" src="" alt="Album" class="footer-widget-img">
                            <span class="footer-widget-text">
                                <span id="song-title-mobile">Loading...</span>
                                <span id="artist-name-mobile">Spotify</span>
                            </span>
                        </a>
                        <span class="footer-widget-divider">·</span>
                        <a id="goodreads-link-mobile" href="https://www.goodreads.com/book/show/824279.The_Death_of_Ivan_Ilyich_and_Other_Stories" target="_blank" class="footer-widget">
                            <img src="assets/images/ivan.png" id="book-image-mobile" alt="Book" class="footer-widget-img book">
                            <span class="footer-widget-text">
                                <span id="book-title-mobile">The Death of Ivan Ilyich</span>
                                <span id="book-author-mobile">Leo Tolstoy</span>
                            </span>
                        </a>
                    </div>
                    
                    <div class="footer-bottom-links">
                        <a href="mailto:mljuboja16@gmail.com"><i class="fas fa-envelope"></i></a>
                        <a href="https://github.com/ljmakaronica" target="_blank"><i class="fab fa-github"></i></a>
                        <a href="https://www.linkedin.com/in/markoljuboja/" target="_blank"><i class="fab fa-linkedin"></i></a>
                    </div>
                    <p>© 2026 Marko Ljuboja</p>
                </footer>
"""
html = re.sub(
    r'<footer class="site-footer">.*?</footer>',
    footer_replacement.strip(),
    html,
    flags=re.DOTALL
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

