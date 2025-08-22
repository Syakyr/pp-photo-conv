# ICA Passport Photo Converter

🌐 **Live Site: [https://syakyr.github.io/pp-photo-conv/](https://syakyr.github.io/pp-photo-conv/)**

A web application that converts regular photos into Singapore ICA-compliant passport photos (400x514 pixels) with automatic face detection and manual adjustments.

## Features

- **Automatic Face Detection**: Uses AI to detect and center faces automatically
- **Manual Positioning**: Click and drag to reposition the photo for perfect centering
- **Zoom Control**: Use mouse wheel or pinch gestures to zoom in/out
- **Adjustable Controls**:
  - Brightness control for lighting correction
  - Re-center button to reset position
  - ICAO-compliant head outline guide (toggle on/off)
- **ICA Compliant**: Outputs 400x514 pixel photos as required by Singapore ICA
- **Multiple Format Support**: Accepts JPG, JPEG, PNG, HEIC, and HEIF formats (max 8MB)

## Requirements

- Node.js (v14 or higher)
- npm

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd passport-photo
```

2. Install dependencies:
```bash
npm install
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. Upload a photo by:
   - Clicking the upload area
   - Dragging and dropping a photo

4. Adjust your photo:
   - Drag the photo to position your face
   - Use mouse wheel or pinch to zoom in/out
   - Adjust brightness if needed
   - Toggle "Show Head Outline" for alignment guide
   - Click "Re-center Photo" to reset position

5. Download the passport photo (400x514px JPG)

## Photo Requirements (ICA Guidelines)

The application helps you meet these ICA requirements:
- ✓ Face centered and looking straight
- ✓ Plain white or light-colored background
- ✓ Neutral expression with mouth closed
- ✓ Eyes open and clearly visible
- ✓ No headwear (except for religious purposes)
- ✓ No sunglasses or tinted glasses
- ✓ Recent photo (within last 3 months)

## Technical Details

- **Dimensions**: 400x514 pixels (ICA standard)
- **File Formats**: JPG, JPEG, PNG, HEIC, HEIF
- **Max File Size**: 8MB
- **Output Format**: JPEG (95% quality)

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server (same as start)

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Face Detection**: Face-API.js
- **Server**: Express.js
- **Image Processing**: Canvas API

## Deployment

### GitHub Pages (Static Hosting)
The app runs as a static site and is automatically deployed to: **[https://syakyr.github.io/pp-photo-conv/](https://syakyr.github.io/pp-photo-conv/)**

1. Enable GitHub Pages in your repository settings
2. The GitHub Action automatically deploys on push to main branch

### Alternative Deployment Options

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts to deploy

#### Netlify
1. Connect your GitHub repository to Netlify
2. Deploy settings are configured in `netlify.toml`
3. Automatic deploys on push to main branch

#### Manual Deployment (VPS/Cloud)
1. Clone repository on your server
2. Run `npm install`
3. Set PORT environment variable (optional)
4. Run `npm start` or use PM2: `pm2 start server.js`

## GitHub Actions Workflow

The repository includes:
- **deploy.yml**: Deploys to GitHub Pages (static hosting)

GitHub Actions automatically deploys to GitHub Pages on every push to the main branch.

## License

MIT