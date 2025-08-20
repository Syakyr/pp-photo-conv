const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🎨 Passport Photo Converter Server Running!`);
    console.log(`📷 Open your browser and go to: http://localhost:${PORT}`);
    console.log(`\n✅ Ready to convert photos to ICA requirements (400x514 pixels)`);
    console.log(`Press Ctrl+C to stop the server\n`);
});