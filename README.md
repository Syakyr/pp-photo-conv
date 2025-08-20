# ICA Passport Photo Converter

A web application that converts regular photos into Singapore ICA-compliant passport photos (400x514 pixels) with automatic face detection, background removal, and manual adjustments.

## Features

- **Automatic Face Detection**: Uses AI to detect and center faces automatically
- **Manual Positioning**: Click and drag to reposition the photo for perfect centering
- **Background Removal**: Option to remove/whiten backgrounds to meet ICA requirements
- **Adjustable Controls**:
  - Zoom slider for size adjustment
  - Brightness control for lighting correction
  - Re-center button to reset position
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
   - Use zoom slider to adjust size
   - Adjust brightness if needed
   - Toggle "Remove Background" for white background

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
The app can run as a static site without the Express server:

1. Enable GitHub Pages in your repository settings
2. The GitHub Action will automatically deploy on push to main branch
3. Access at: `https://[username].github.io/[repository-name]/`

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Or use the GitHub Action with these secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

### Netlify
1. Connect your GitHub repository to Netlify
2. Deploy settings are configured in `netlify.toml`
3. Automatic deploys on push to main branch

### Manual Deployment (VPS/Cloud)
1. Clone repository on your server
2. Run `npm install`
3. Set PORT environment variable (optional)
4. Run `npm start` or use PM2: `pm2 start server.js`

## GitHub Actions Workflows

Two workflows are included:
- **deploy.yml**: Deploys to GitHub Pages (static hosting)
- **deploy-vercel.yml**: Deploys to Vercel (with preview deployments for PRs)

To use GitHub Actions:
1. Push to main branch for production deployment
2. Create pull requests for preview deployments (Vercel only)

## License

MIT