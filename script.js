let uploadedImage = null;
let processedImageData = null;
let currentZoom = 1;
let currentBrightness = 1;
let faceDetection = null;
let originalCropData = null;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let backgroundRemoval = false;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const processingSection = document.getElementById('processingSection');
const originalCanvas = document.getElementById('originalCanvas');
const processedCanvas = document.getElementById('processedCanvas');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const zoomSlider = document.getElementById('zoomSlider');
const zoomValue = document.getElementById('zoomValue');
const brightnessSlider = document.getElementById('brightnessSlider');
const brightnessValue = document.getElementById('brightnessValue');
const faceDetectionStatus = document.getElementById('faceDetectionStatus');
const backgroundToggle = document.getElementById('backgroundToggle');
const recenterBtn = document.getElementById('recenterBtn');

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
    const ctx = processedCanvas.getContext('2d');
    const targetWidth = 400;
    const targetHeight = 514;
    
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    
    let sourceX = 0, sourceY = 0, sourceWidth = uploadedImage.width, sourceHeight = uploadedImage.height;
    
    if (detections) {
        const box = detections.detection.box;
        const scaleFactor = uploadedImage.width / originalCanvas.width;
        
        const faceWidth = box.width * scaleFactor;
        const faceCenterX = (box.x + box.width / 2) * scaleFactor;
        const faceCenterY = (box.y + box.height / 2) * scaleFactor;
        
        const expansionFactor = 2.5;
        sourceWidth = faceWidth * expansionFactor;
        sourceHeight = sourceWidth * (targetHeight / targetWidth);
        
        sourceX = Math.max(0, faceCenterX - sourceWidth / 2);
        sourceY = Math.max(0, faceCenterY - sourceHeight / 2.2);
        
        if (sourceX + sourceWidth > uploadedImage.width) {
            sourceX = uploadedImage.width - sourceWidth;
        }
        if (sourceY + sourceHeight > uploadedImage.height) {
            sourceY = uploadedImage.height - sourceHeight;
        }
    } else {
        const aspectRatio = targetWidth / targetHeight;
        if (uploadedImage.width / uploadedImage.height > aspectRatio) {
            sourceWidth = uploadedImage.height * aspectRatio;
            sourceX = (uploadedImage.width - sourceWidth) / 2;
        } else {
            sourceHeight = uploadedImage.width / aspectRatio;
            sourceY = (uploadedImage.height - sourceHeight) / 2;
        }
    }
    
    originalCropData = {
        sourceX: sourceX,
        sourceY: sourceY,
        sourceWidth: sourceWidth,
        sourceHeight: sourceHeight
    };
    
    updatePassportPhoto();
}

function updatePassportPhoto() {
    if (!originalCropData || !uploadedImage) return;
    
    const ctx = processedCanvas.getContext('2d');
    const targetWidth = 400;
    const targetHeight = 514;
    
    // Clear canvas with white background
    ctx.fillStyle = backgroundRemoval ? '#ffffff' : '#f0f0f0';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    
    // Calculate cropped dimensions based on zoom
    const croppedWidth = originalCropData.sourceWidth / currentZoom;
    const croppedHeight = originalCropData.sourceHeight / currentZoom;
    
    // Center the crop area and apply offsets
    const cropX = originalCropData.sourceX + (originalCropData.sourceWidth - croppedWidth) / 2 + offsetX;
    const cropY = originalCropData.sourceY + (originalCropData.sourceHeight - croppedHeight) / 2 + offsetY;
    
    // Ensure crop area stays within image bounds
    const clampedX = Math.max(0, Math.min(cropX, uploadedImage.width - croppedWidth));
    const clampedY = Math.max(0, Math.min(cropY, uploadedImage.height - croppedHeight));
    const clampedWidth = Math.min(croppedWidth, uploadedImage.width - clampedX);
    const clampedHeight = Math.min(croppedHeight, uploadedImage.height - clampedY);
    
    ctx.filter = `brightness(${currentBrightness})`;
    
    if (backgroundRemoval) {
        // Create temporary canvas for background removal
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = targetWidth;
        tempCanvas.height = targetHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw image on temp canvas maintaining aspect ratio
        tempCtx.filter = `brightness(${currentBrightness})`;
        tempCtx.drawImage(
            uploadedImage,
            clampedX, clampedY, clampedWidth, clampedHeight,
            0, 0, targetWidth, targetHeight
        );
        
        // Apply simple background removal (white threshold)
        const imageData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imageData.data;
        
        // Simple edge detection and background replacement
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Check if pixel is likely background (light colored)
            const brightness = (r + g + b) / 3;
            const saturation = Math.max(r, g, b) - Math.min(r, g, b);
            
            // If pixel is very light and low saturation, make it white
            if (brightness > 180 && saturation < 50) {
                data[i] = 255;     // R
                data[i + 1] = 255; // G
                data[i + 2] = 255; // B
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    } else {
        // Draw image maintaining aspect ratio
        ctx.drawImage(
            uploadedImage,
            clampedX, clampedY, clampedWidth, clampedHeight,
            0, 0, targetWidth, targetHeight
        );
    }
    
    ctx.filter = 'none';
}

zoomSlider.addEventListener('input', (e) => {
    currentZoom = parseFloat(e.target.value);
    zoomValue.textContent = currentZoom.toFixed(1) + 'x';
    updatePassportPhoto();
});

brightnessSlider.addEventListener('input', (e) => {
    currentBrightness = parseFloat(e.target.value);
    brightnessValue.textContent = Math.round(currentBrightness * 100) + '%';
    updatePassportPhoto();
});

// Add mouse drag functionality
processedCanvas.addEventListener('mousedown', (e) => {
    if (!originalCropData) return;
    isDragging = true;
    const rect = processedCanvas.getBoundingClientRect();
    dragStartX = e.clientX - rect.left;
    dragStartY = e.clientY - rect.top;
    processedCanvas.style.cursor = 'grabbing';
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (isDragging && originalCropData) {
        const rect = processedCanvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        // Calculate movement delta (inverted for natural dragging)
        const deltaX = -(currentX - dragStartX);
        const deltaY = -(currentY - dragStartY);
        
        // Apply movement to offsets
        offsetX += deltaX;
        offsetY += deltaY;
        
        // Update drag start position for next movement
        dragStartX = currentX;
        dragStartY = currentY;
        
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

// Add touch drag functionality for mobile
processedCanvas.addEventListener('touchstart', (e) => {
    if (!originalCropData) return;
    isDragging = true;
    const touch = e.touches[0];
    const rect = processedCanvas.getBoundingClientRect();
    dragStartX = touch.clientX - rect.left;
    dragStartY = touch.clientY - rect.top;
    e.preventDefault();
});

document.addEventListener('touchmove', (e) => {
    if (isDragging && originalCropData) {
        const touch = e.touches[0];
        const rect = processedCanvas.getBoundingClientRect();
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;
        
        // Calculate movement delta (inverted for natural dragging)
        const deltaX = -(currentX - dragStartX);
        const deltaY = -(currentY - dragStartY);
        
        // Apply movement to offsets
        offsetX += deltaX;
        offsetY += deltaY;
        
        // Update drag start position for next movement
        dragStartX = currentX;
        dragStartY = currentY;
        
        updatePassportPhoto();
        e.preventDefault();
    }
});

document.addEventListener('touchend', () => {
    if (isDragging) {
        isDragging = false;
    }
});

// Background removal toggle
backgroundToggle.addEventListener('change', (e) => {
    backgroundRemoval = e.target.checked;
    updatePassportPhoto();
});

// Re-center button
recenterBtn.addEventListener('click', () => {
    offsetX = 0;
    offsetY = 0;
    updatePassportPhoto();
    // Ensure cursor remains as move after re-centering
    if (processedCanvas) {
        processedCanvas.style.cursor = 'move';
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
    offsetX = 0;
    offsetY = 0;
    backgroundRemoval = false;
    zoomSlider.value = 1;
    brightnessSlider.value = 1;
    backgroundToggle.checked = false;
    zoomValue.textContent = '1.0x';
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