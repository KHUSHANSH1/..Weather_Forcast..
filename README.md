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