let uploadedImage = null;
let processedImageData = null;
let currentZoom = 1;
let currentBrightness = 1;
let faceDetection = null;
let originalCropData = null;
let imageX = 0; // Image position in viewport
let imageY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
// Background removal variables removed - feature disabled
let isProcessingBackground = false;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const processingSection = document.getElementById('processingSection');
const originalCanvas = document.getElementById('originalCanvas');
const processedCanvas = document.getElementById('processedCanvas');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const brightnessSlider = document.getElementById('brightnessSlider');
const brightnessValue = document.getElementById('brightnessValue');
const faceDetectionStatus = document.getElementById('faceDetectionStatus');
const recenterBtn = document.getElementById('recenterBtn');
const headOutlineToggle = document.getElementById('headOutlineToggle');
const headOutline = document.getElementById('headOutline');

// Background removal functionality disabled for proxy environment compatibility

async function loadFaceAPIModels() {
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model');
        await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model');
        await faceapi.nets.ssdMobilenetv1.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model');
        console.log('Face detection models loaded');
    } catch (error) {
        console.error('Error loading face detection models:', error);
        showStatus('Face detection models could not be loaded. Manual positioning mode enabled.', 'warning');
    }
}

loadFaceAPIModels();

// AI Background Removal Function
// Background removal function removed - feature disabled

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
    
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|heic|heif)$/i)) {
        showStatus('Please upload a valid image file (JPG, JPEG, PNG, HEIC, HEIF)', 'error');
        return;
    }
    
    if (file.size > 8 * 1024 * 1024) {
        showStatus('File size must be less than 8MB', 'error');
        return;
    }
    
    // Clear any previous state
    // (Background removal feature disabled)
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            uploadedImage = img;
            processImage();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function processImage() {
    processingSection.style.display = 'block';
    
    const maxWidth = 400;
    const scale = Math.min(maxWidth / uploadedImage.width, maxWidth / uploadedImage.height, 1);
    originalCanvas.width = uploadedImage.width * scale;
    originalCanvas.height = uploadedImage.height * scale;
    
    const ctx = originalCanvas.getContext('2d');
    ctx.drawImage(uploadedImage, 0, 0, originalCanvas.width, originalCanvas.height);
    
    try {
        // Try multiple detection methods
        let detections = await faceapi.detectSingleFace(originalCanvas, new faceapi.TinyFaceDetectorOptions({
            inputSize: 512,
            scoreThreshold: 0.3
        })).withFaceLandmarks();
        
        // If tiny detector fails, try SSD MobileNet
        if (!detections) {
            detections = await faceapi.detectSingleFace(originalCanvas, new faceapi.SsdMobilenetv1Options({
                minConfidence: 0.3
            })).withFaceLandmarks();
        }
        
        if (detections) {
            faceDetection = detections;
            showStatus('Face detected! You can drag the photo to adjust position.', 'success');
            await createPassportPhoto(detections);
        } else {
            showStatus('No face detected. Please position manually by dragging the photo.', 'warning');
            await createPassportPhoto(null);
        }
    } catch (error) {
        console.error('Face detection error:', error);
        showStatus('Face detection unavailable. Please position manually by dragging the photo.', 'warning');
        await createPassportPhoto(null);
    }
}

async function createPassportPhoto(detections) {
    const viewportWidth = 400;
    const viewportHeight = 514;
    
    // Calculate cover fit zoom (like CSS object-fit: cover)
    // This ensures the image always completely covers the viewport with no empty space
    const scaleX = viewportWidth / uploadedImage.width;
    const scaleY = viewportHeight / uploadedImage.height;
    const minZoom = Math.max(scaleX, scaleY); // Use larger scale to cover completely
    
    // Calculate initial image positioning
    if (detections) {
        const box = detections.detection.box;
        const scaleFactor = uploadedImage.width / originalCanvas.width;
        
        const faceWidth = box.width * scaleFactor;
        const faceCenterX = (box.x + box.width / 2) * scaleFactor;
        const faceCenterY = (box.y + box.height / 2) * scaleFactor;
        
        // Calculate initial zoom to fit face nicely, but ensure it covers viewport
        const desiredFaceSize = viewportWidth * 0.4; // Face should be ~40% of viewport width
        const faceZoom = desiredFaceSize / faceWidth;
        currentZoom = Math.max(minZoom, faceZoom); // Use larger of cover fit or face zoom
        
        // Calculate scaled dimensions
        const scaledWidth = uploadedImage.width * currentZoom;
        const scaledHeight = uploadedImage.height * currentZoom;
        
        // Position face in viewport (face slightly above center)
        imageX = (viewportWidth / 2) - (faceCenterX * currentZoom);
        imageY = (viewportHeight * 0.4) - (faceCenterY * currentZoom);
        
    } else {
        // No face detected - use cover fit
        currentZoom = minZoom;
        
        const scaledWidth = uploadedImage.width * currentZoom;
        const scaledHeight = uploadedImage.height * currentZoom;
        
        // Center the image in viewport
        imageX = (viewportWidth - scaledWidth) / 2;
        imageY = (viewportHeight - scaledHeight) / 2;
    }
    
    // Store data for reset and zoom limits
    originalCropData = {
        initialZoom: currentZoom,
        initialX: imageX,
        initialY: imageY,
        minZoom: minZoom, // Minimum zoom to maintain cover fit
        imageWidth: uploadedImage.width,
        imageHeight: uploadedImage.height
    };
    
    updatePassportPhoto();
}

function updatePassportPhoto() {
    if (!uploadedImage || !originalCropData) return;
    
    const ctx = processedCanvas.getContext('2d');
    const viewportWidth = 400;
    const viewportHeight = 514;
    
    // Use original image (background removal disabled)
    const imageToUse = uploadedImage;
    
    // Calculate scaled image dimensions
    const scaledWidth = imageToUse.width * currentZoom;
    const scaledHeight = imageToUse.height * currentZoom;
    
    // Constrain image position to prevent gray background from showing
    // Image must always completely cover the viewport
    const minX = viewportWidth - scaledWidth;  // Leftmost position (negative when image > viewport)
    const maxX = 0;                            // Rightmost position
    const minY = viewportHeight - scaledHeight; // Topmost position (negative when image > viewport)
    const maxY = 0;                            // Bottommost position
    
    // Clamp image position to bounds
    imageX = Math.max(minX, Math.min(maxX, imageX));
    imageY = Math.max(minY, Math.min(maxY, imageY));
    
    // Clear viewport with light gray background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    
    ctx.filter = `brightness(${currentBrightness})`;
    
    // Draw the image (either original or AI-processed with transparent background)
    ctx.drawImage(
        imageToUse,
        imageX, imageY,
        scaledWidth, scaledHeight
    );
    
    ctx.filter = 'none';
}


// Brightness control
brightnessSlider.addEventListener('input', (e) => {
    currentBrightness = parseFloat(e.target.value);
    brightnessValue.textContent = Math.round(currentBrightness * 100) + '%';
    updatePassportPhoto();
});

// Mouse wheel zoom
processedCanvas.addEventListener('wheel', (e) => {
    if (!uploadedImage || !originalCropData) return;
    e.preventDefault();
    
    const rect = processedCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Zoom factor
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(originalCropData.minZoom, Math.min(5, currentZoom * zoomFactor));
    
    // Zoom towards mouse position
    const zoomChange = newZoom / currentZoom;
    imageX = mouseX - (mouseX - imageX) * zoomChange;
    imageY = mouseY - (mouseY - imageY) * zoomChange;
    
    currentZoom = newZoom;
    updatePassportPhoto();
});

// Mouse drag functionality
processedCanvas.addEventListener('mousedown', (e) => {
    if (!uploadedImage) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    processedCanvas.style.cursor = 'grabbing';
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;
        
        imageX += deltaX;
        imageY += deltaY;
        
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        
        updatePassportPhoto();
    }
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        if (processedCanvas) {
            processedCanvas.style.cursor = 'move';
        }
    }
});

// Touch support
let initialPinchDistance = 0;
let initialZoom = 1;

processedCanvas.addEventListener('touchstart', (e) => {
    if (!uploadedImage) return;
    e.preventDefault();
    
    if (e.touches.length === 1) {
        // Single touch - drag
        isDragging = true;
        dragStartX = e.touches[0].clientX;
        dragStartY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        // Two touches - pinch zoom
        isDragging = false;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialPinchDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        initialZoom = currentZoom;
    }
});

document.addEventListener('touchmove', (e) => {
    if (!uploadedImage) return;
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging) {
        // Single touch drag
        const deltaX = e.touches[0].clientX - dragStartX;
        const deltaY = e.touches[0].clientY - dragStartY;
        
        imageX += deltaX;
        imageY += deltaY;
        
        dragStartX = e.touches[0].clientX;
        dragStartY = e.touches[0].clientY;
        
        updatePassportPhoto();
    } else if (e.touches.length === 2) {
        // Pinch zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        
        if (initialPinchDistance > 0 && originalCropData) {
            const scale = currentDistance / initialPinchDistance;
            const newZoom = Math.max(originalCropData.minZoom, Math.min(5, initialZoom * scale));
            
            // Get center point of pinch
            const rect = processedCanvas.getBoundingClientRect();
            const centerX = ((touch1.clientX + touch2.clientX) / 2) - rect.left;
            const centerY = ((touch1.clientY + touch2.clientY) / 2) - rect.top;
            
            // Zoom towards pinch center
            const zoomChange = newZoom / currentZoom;
            imageX = centerX - (centerX - imageX) * zoomChange;
            imageY = centerY - (centerY - imageY) * zoomChange;
            
            currentZoom = newZoom;
            updatePassportPhoto();
        }
    }
});

document.addEventListener('touchend', () => {
    isDragging = false;
    initialPinchDistance = 0;
});


// Head outline toggle
headOutlineToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        headOutline.style.display = 'block';
        showStatus('Head outline enabled - align your photo to the green guides', 'success');
    } else {
        headOutline.style.display = 'none';
    }
});

// Re-center button
recenterBtn.addEventListener('click', () => {
    if (originalCropData) {
        currentZoom = originalCropData.initialZoom;
        imageX = originalCropData.initialX;
        imageY = originalCropData.initialY;
        updatePassportPhoto();
        // Ensure cursor remains as move after re-centering
        if (processedCanvas) {
            processedCanvas.style.cursor = 'move';
        }
    }
});

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'passport-photo-400x514.jpg';
    
    processedCanvas.toBlob((blob) => {
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        showStatus('Photo downloaded successfully!', 'success');
    }, 'image/jpeg', 0.95);
});

resetBtn.addEventListener('click', () => {
    uploadedImage = null;
    processedImageData = null;
    originalCropData = null;
    faceDetection = null;
    currentZoom = 1;
    currentBrightness = 1;
    imageX = 0;
    imageY = 0;
    brightnessSlider.value = 1;
    headOutlineToggle.checked = false;
    headOutline.style.display = 'none';
    brightnessValue.textContent = '100%';
    processingSection.style.display = 'none';
    fileInput.value = '';
    faceDetectionStatus.innerHTML = '';
    faceDetectionStatus.className = 'status-message';
});

function showStatus(message, type) {
    faceDetectionStatus.textContent = message;
    faceDetectionStatus.className = `status-message ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            faceDetectionStatus.innerHTML = '';
            faceDetectionStatus.className = 'status-message';
        }, 5000);
    }
}