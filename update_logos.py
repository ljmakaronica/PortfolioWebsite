import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the inline style for logos
old_style = r'<style>.*?@media \(max-width: 600px\) \{.*?\}.*?</style>'
new_style = """<style>
        .experience-company {
            display: flex;
            align-items: center;
            gap: clamp(0.75rem, 1vw, 1rem);
            min-width: 0;
        }

        .experience-company-logo {
            width: clamp(46px, 4.5vw, 58px);
            height: clamp(46px, 4.5vw, 58px);
            border-radius: 0.7rem;
            flex-shrink: 0;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .experience-company-logo img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        /* Clean logo removes background/border radius when the original image is transparent */
        .experience-company-logo.clean-logo {
            border-radius: 0;
            overflow: visible;
            box-shadow: none;
        }

        .experience-company-logo.clean-logo img {
            object-fit: contain;
            width: 85%;
            height: 85%;
        }

        /* Fine-tuning for visual harmony */
        .experience-company-logo img[alt="Adyen logo"] {
            width: 110%; /* Adyen is a horizontal wordmark, needs more width to balance a solid block */
            height: auto;
            max-width: none;
            margin-left: -5%; /* Center it */
        }

        .experience-company-logo img[alt="All Meal Prep logo"] {
            width: 95%; /* Circular, scale slightly */
            height: 95%;
        }

        @media (max-width: 600px) {
            .experience-company-logo {
                width: 44px;
                height: 44px;
                border-radius: 0.6rem;
            }
        }
    </style>"""

html = re.sub(old_style, new_style, html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
