# Demo recording

Create a short GIF that shows:
- Entering a question
- Seeing intent/confidence badges
- Reviewing grouped actions and citations

Suggested tools:
- Kap (macOS)
- ScreenToGif (Windows)
- ffmpeg (cross-platform)

Example commands with ffmpeg:
```
ffmpeg -y -i input.mov -vf "fps=12,scale=900:-1:flags=lanczos" docs/demo.gif
```
