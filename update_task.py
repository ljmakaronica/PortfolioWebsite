import re

with open('/Users/markoljuboja/.gemini/antigravity/brain/c31cb462-b941-4dd8-b823-ba4e8dcf755f/task.md', 'r') as f:
    text = f.read()
    
# Replace [ ] with [x] for all items
text = text.replace('- [ ]', '- [x]')

with open('/Users/markoljuboja/.gemini/antigravity/brain/c31cb462-b941-4dd8-b823-ba4e8dcf755f/task.md', 'w') as f:
    f.write(text)
