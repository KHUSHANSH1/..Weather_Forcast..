# WeatherVerse - Global Weather Application

WeatherVerse is a comprehensive weather application that provides detailed weather information for locations around the world. It features a beautiful, responsive user interface with real-time weather data, forecasts, weather maps, and more.

![WeatherVerse Screenshot](screenshot.png)

## Features

- **Current Weather Display**: View detailed current weather conditions including temperature, feels like, humidity, wind speed, and pressure.
- **5-Day Forecast**: Plan ahead with a 5-day weather forecast.
- **Interactive Weather Maps**: Explore temperature, precipitation, wind, and cloud patterns on an interactive map.
- **Air Quality Information**: Check the air quality index for any location.
- **Sun and Moon Information**: View sunrise, sunset times, and moon phase.
- **Unit Toggle**: Switch between Celsius and Fahrenheit.
- **Responsive Design**: Works on desktop, tablet, and mobile devices.
- **Geolocation Support**: Automatically detect and display weather for your current location.
- **Beautiful UI**: Enjoy a visually appealing interface with weather-based themes and animations.

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- An OpenWeatherMap API key (free tier available)

### Setup

1. Clone or download this repository to your local machine.
2. Open `script.js` and add your OpenWeatherMap API key:
   ```javascript
   const API_KEY = 'your_api_key_here';
   ```
3. Open `index.html` in your web browser.

### Getting an API Key

1. Sign up for a free account at [OpenWeatherMap](https://openweathermap.org/).
2. Navigate to the API keys section in your account.
3. Generate a new API key.
4. Copy the key and paste it into the `script.js` file.

## Usage

- **Search for a Location**: Enter a city name in the search box and press Enter or click the search button.
- **Toggle Temperature Units**: Click on °C or °F buttons to switch between Celsius and Fahrenheit.
- **View Forecast**: Scroll down to see the 5-day forecast.
- **Explore Weather Maps**: Click on the map layer buttons (Temperature, Precipitation, Wind, Clouds) to change the map view.
- **Check Additional Information**: View air quality, sunrise/sunset times, and moon phase information.

## Troubleshooting API Issues

If you encounter the error message "Failed to fetch weather data. Please try again," try the following solutions:

### API Key Issues

- Make sure you've added your API key correctly in the `script.js` file.
- Check if your API key is valid and active in your OpenWeatherMap account.
- New API keys may take a few hours to activate after creation.
- Free tier API keys have usage limits. Check if you've exceeded your daily quota.

### CORS Issues

If you're getting CORS-related errors in the browser console, you can enable the CORS proxy:

1. Open `script.js`
2. Find the line `const USE_CORS_PROXY = false;` and change it to `const USE_CORS_PROXY = true;`

Note: The default CORS proxy (cors-anywhere.herokuapp.com) may require you to visit their website and request temporary access before it will work.

### Alternative API

If OpenWeatherMap is not working for you, you can use an alternative weather API:

1. Sign up for a free account at [WeatherAPI.com](https://www.weatherapi.com/)
2. Get your API key
3. Open `script.js`
4. Uncomment the fallback API configuration lines and add your key:
   ```javascript
   const USE_FALLBACK_API = true;
   const FALLBACK_API_KEY = 'your_weatherapi_key_here';
   ```

### Network Issues

- Check your internet connection
- Try disabling any ad blockers or privacy extensions that might be blocking API requests
- Try using a different network (e.g., switch from Wi-Fi to mobile data)

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- [OpenWeatherMap API](https://openweathermap.org/api)
- [Leaflet.js](https://leafletjs.com/) for interactive maps
- [Font Awesome](https://fontawesome.com/) for icons

## Customization

Feel free to customize the application by:

- Modifying the color scheme in the CSS variables (`:root` section in `style.css`)
- Adding additional weather data points
- Implementing new features like weather alerts or historical weather data

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgements

- Weather data provided by [OpenWeatherMap](https://openweathermap.org/)
- Maps powered by [Leaflet](https://leafletjs.com/) and [OpenStreetMap](https://www.openstreetmap.org/)
- Icons by [Font Awesome](https://fontawesome.com/)

## Publishing to Google Play Store

To publish your WeatherVerse app to the Google Play Store, follow these steps:

### 1. Generate App Icons and Download Images

1. Open the `generate-icons.html` file in your browser
2. Click "Generate Icons" to create app icons in various sizes
3. Click "Download All Icons" and save them to the `/icons` folder

For weather background images and screenshots:
1. Open the `download-images.html` file in your browser
2. Click "Download All Images" to download all the required images
3. Make sure the images are saved in their respective folders:
   - Weather backgrounds in the `/backgrounds` folder
   - App screenshots in the `/screenshots` folder

### 2. Package the App as a TWA (Trusted Web Activity)

1. Install Android Studio from [developer.android.com](https://developer.android.com/studio)
2. Install the PWA Builder plugin for Android Studio
3. Use Bubblewrap CLI or PWA Builder to create a TWA:

```bash
# Install Bubblewrap CLI
npm i -g @bubblewrap/cli

# Initialize a new TWA project
bubblewrap init --manifest https://your-deployed-url.com/manifest.json

# Build the Android App Bundle
bubblewrap build
```

Alternatively, use the online [PWA Builder](https://www.pwabuilder.com/) to generate your Android package.

### 3. Prepare for Google Play Store

1. Create a developer account on the [Google Play Console](https://play.google.com/console)
2. Pay the one-time $25 registration fee
3. Create a new app in the Play Console
4. Fill in all required information:
   - App name: WeatherVerse
   - Short description: A beautiful weather app with real-time forecasts
   - Full description: WeatherVerse is a modern weather application featuring real-time forecasts, beautiful animations, and a Samsung A-14 style interface. Get accurate weather data, 5-day forecasts, air quality information, and more in a sleek, user-friendly design.
   - App category: Weather
   - Content rating: Complete the rating questionnaire
   - Upload your app icons and screenshots

### 4. Upload Your App Bundle

1. Upload the Android App Bundle (.aab file) generated by Bubblewrap or PWA Builder
2. Complete the store listing with screenshots and feature graphic
3. Set up pricing and distribution (free app, available countries)
4. Submit for review

### 5. Wait for Approval

Google will review your app, which typically takes 1-3 days. Once approved, your WeatherVerse app will be available on the Google Play Store!

## Development

### Prerequisites

- Web server (local or hosted)
- OpenWeatherMap API key (update in script.js)

### Local Development

1. Clone the repository
2. Update the API key in script.js
3. Serve the files using a local web server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

4. Open http://localhost:8000 in your browser

## Credits

- Created by Khushansh
- Weather data provided by [OpenWeatherMap](https://openweathermap.org/)
- Maps powered by [Leaflet](https://leafletjs.com/)
- Icons by [Font Awesome](https://fontawesome.com/) 