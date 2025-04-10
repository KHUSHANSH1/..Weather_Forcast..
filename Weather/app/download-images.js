// Script to download weather-related images for WeatherVerse app
const fs = require('fs');
const https = require('https');
const path = require('path');

// Create directories if they don't exist
const directories = ['icons', 'backgrounds', 'screenshots'];
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Function to download an image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image. Status code: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Downloaded: ${filepath}`);
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete the file if there's an error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Image URLs to download
const imagesToDownload = [
  // Weather backgrounds
  {
    url: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?w=800&auto=format&fit=crop',
    filepath: 'backgrounds/clear.jpg',
    description: 'Clear sky background'
  },
  {
    url: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&auto=format&fit=crop',
    filepath: 'backgrounds/clouds.jpg',
    description: 'Cloudy background'
  },
  {
    url: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800&auto=format&fit=crop',
    filepath: 'backgrounds/rain.jpg',
    description: 'Rainy background'
  },
  {
    url: 'https://images.unsplash.com/photo-1516431883659-655d41c09bf9?w=800&auto=format&fit=crop',
    filepath: 'backgrounds/snow.jpg',
    description: 'Snowy background'
  },
  
  // Screenshots for Play Store
  {
    url: 'https://images.unsplash.com/photo-1584267385494-9fdd9a71ad75?w=400&auto=format&fit=crop',
    filepath: 'screenshots/screenshot1.jpg',
    description: 'App screenshot 1'
  },
  {
    url: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?w=400&auto=format&fit=crop',
    filepath: 'screenshots/screenshot2.jpg',
    description: 'App screenshot 2'
  }
];

// Download all images
async function downloadAllImages() {
  console.log('Starting download of images...');
  
  for (const image of imagesToDownload) {
    try {
      await downloadImage(image.url, image.filepath);
    } catch (error) {
      console.error(`Error downloading ${image.filepath}: ${error.message}`);
    }
  }
  
  console.log('All downloads completed!');
}

// Start downloading
downloadAllImages(); 