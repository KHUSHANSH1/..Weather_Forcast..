// API Configuration
const API_KEY = 'e89804389d6faa940a80244b2f14224f'; // Add your OpenWeatherMap API key here
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';
const WEATHER_ICON_URL = 'https://openweathermap.org/img/wn/';

// Fallback API Configuration (WeatherAPI.com - free tier)
// Uncomment and add your key if OpenWeatherMap is not working
// const USE_FALLBACK_API = false;
// const FALLBACK_API_KEY = 'your_weatherapi_key_here';
// const FALLBACK_API_URL = 'https://api.weatherapi.com/v1';

// CORS Proxy Configuration (use only if needed)
const USE_CORS_PROXY = false; // Set to true if you encounter CORS issues
const CORS_PROXY_URL = 'https://cors-anywhere.herokuapp.com/';

// Helper function to handle API URLs with optional CORS proxy
function getApiUrl(url) {
    return USE_CORS_PROXY ? `${CORS_PROXY_URL}${url}` : url;
}

// Helper function for API fetch with error handling
async function fetchWithErrorHandling(url, description) {
    console.log(`Fetching ${description} from: ${url}`);
    
    try {
        // Add cache-busting parameter to prevent browser caching
        const urlWithNoCaching = url + (url.includes('?') ? '&' : '?') + '_nocache=' + new Date().getTime();
        console.log(`Using no-cache URL: ${urlWithNoCaching}`);
        
        // Create fetch options with cache control
        const fetchOptions = {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        };
        
        const response = await fetch(getApiUrl(urlWithNoCaching), fetchOptions);
        
        if (!response.ok) {
            throw new Error(`${description} API responded with status: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`${description} API response:`, data);
        return data;
    } catch (error) {
        console.error(`Error fetching ${description}:`, error);
        throw error;
    }
}

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const celsiusBtn = document.getElementById('celsius');
const fahrenheitBtn = document.getElementById('fahrenheit');
const cityEl = document.getElementById('city');
const countryEl = document.getElementById('country');
const dateEl = document.getElementById('date');
const tempEl = document.getElementById('temp');
const tempHiEl = document.getElementById('temp-hi');
const tempLoEl = document.getElementById('temp-lo');
const weatherIconEl = document.getElementById('weather-icon');
const weatherDescEl = document.getElementById('weather-description');
const feelsLikeEl = document.getElementById('feels-like');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const pressureEl = document.getElementById('pressure');
const forecastContainerEl = document.getElementById('forecast-container');
const mapEl = document.getElementById('map');
const mapOptions = document.querySelectorAll('.map-option');
const aqiValueEl = document.getElementById('aqi-value');
const aqiLabelEl = document.getElementById('aqi-label');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');
const moonPhaseEl = document.getElementById('moon-phase');
const moonIconEl = document.getElementById('moon-icon');
const loaderEl = document.getElementById('loader');

// Global Variables
let currentUnit = 'metric'; // 'metric' for Celsius, 'imperial' for Fahrenheit
let map = null;
let weatherLayer = null;
let currentWeatherData = null;
let currentCity = null;
let currentCoords = null;

// Initialize the application
function initApp() {
    // Verify API key first
    verifyApiKey();
    
    // Event listeners
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    celsiusBtn.addEventListener('click', () => changeUnit('metric'));
    fahrenheitBtn.addEventListener('click', () => changeUnit('imperial'));
    
    mapOptions.forEach(option => {
        option.addEventListener('click', () => changeMapLayer(option.dataset.layer));
    });
    
    // Initialize map on demand instead of immediately
    document.querySelector('.weather-map').addEventListener('click', function() {
        if (!map) {
            initMap();
        }
    });
}

// Verify API key validity
async function verifyApiKey() {
    if (!API_KEY || API_KEY === '' || API_KEY === 'your_api_key_here') {
        alert('Please add your OpenWeatherMap API key in the script.js file.');
        return;
    }
    
    try {
        showLoader();
        console.log('Verifying API key validity...');
        
        // Try a simple API call to verify the key
        const testUrl = `${BASE_URL}/weather?q=London&appid=${API_KEY}`;
        await fetchWithErrorHandling(testUrl, 'API Key Validation');
        
        console.log('API key is valid. Proceeding with geolocation or default city.');
        
        // Get user's location if available
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    getWeatherByCoords(latitude, longitude);
                },
                error => {
                    console.error('Error getting location:', error);
                    getWeatherByCity('London'); // Default city
                }
            );
        } else {
            getWeatherByCity('London'); // Default city
        }
    } catch (error) {
        console.error('API key validation failed:', error);
        
        if (error.message.includes('401') || error.message.includes('403')) {
            alert('Invalid API key. Please check your OpenWeatherMap API key in script.js.');
        } else if (error.message.includes('429')) {
            alert('API rate limit exceeded. Please try again later or use a different API key.');
        } else {
            alert(`API connection error: ${error.message}. Check your internet connection or try enabling the CORS proxy.`);
            // Try with default city anyway
            getWeatherByCity('London');
        }
        
        hideLoader();
    }
}

// Show loader
function showLoader() {
    loaderEl.classList.add('active');
}

// Hide loader
function hideLoader() {
    loaderEl.classList.remove('active');
}

// Handle search
function handleSearch() {
    const city = searchInput.value.trim();
    if (city) {
        showLoader();
        getWeatherByCity(city);
    }
}

// Change temperature unit
function changeUnit(unit) {
    if (unit === currentUnit) return;
    
    // Store the previous unit to log the change
    const previousUnit = currentUnit;
    currentUnit = unit;
    
    console.log(`Changing unit from ${previousUnit} to ${currentUnit}`);
    
    // Update UI
    if (unit === 'metric') {
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
    } else {
        celsiusBtn.classList.remove('active');
        fahrenheitBtn.classList.add('active');
    }
    
    // Always fetch new data when changing units to ensure correct values
    if (currentCoords) {
        console.log(`Fetching new weather data for coords: ${currentCoords.lat}, ${currentCoords.lon} with unit: ${currentUnit}`);
        showLoader();
        getWeatherData(currentCoords.lat, currentCoords.lon, currentCity, currentWeatherData?.country);
    } else if (currentCity) {
        console.log(`Fetching new weather data for city: ${currentCity} with unit: ${currentUnit}`);
        showLoader();
        getWeatherByCity(currentCity);
    } else {
        console.log('No location set, cannot fetch new data');
        // If no location is set yet, just update the UI with existing data
        if (currentWeatherData) {
            updateWeatherUI(currentWeatherData);
        }
    }
}

// Initialize map
function initMap() {
    if (map) return; // Prevent multiple initializations
    
    console.log('Initializing map...');
    map = L.map('map').setView([51.505, -0.09], 3);
    
    // Use a faster, lighter tile provider
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
        // Add tile loading optimization
        updateWhenIdle: true,
        updateWhenZooming: false,
        noWrap: true
    }).addTo(map);
    
    // Default weather layer (temperature)
    changeMapLayer('temp');
    
    // If we already have weather data, update the map
    if (currentCoords) {
        map.setView([currentCoords.lat, currentCoords.lon], 10);
        
        // Add marker for the location
        if (currentCity) {
            L.marker([currentCoords.lat, currentCoords.lon]).addTo(map)
                .bindPopup(`<b>${currentCity}</b>`)
                .openPopup();
        }
    }
}

// Change map layer
function changeMapLayer(layer) {
    // Initialize map if not already initialized
    if (!map) {
        initMap();
        return;
    }
    
    // Remove current layer if exists
    if (weatherLayer) {
        map.removeLayer(weatherLayer);
    }
    
    // Update active button
    mapOptions.forEach(option => {
        if (option.dataset.layer === layer) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // Add new layer
    const layerUrl = getWeatherLayerUrl(layer);
    weatherLayer = L.tileLayer(layerUrl, {
        updateWhenIdle: true,
        updateWhenZooming: false
    }).addTo(map);
}

// Get weather layer URL
function getWeatherLayerUrl(layer) {
    const layerMap = {
        'temp': 'temp_new',
        'precipitation': 'precipitation_new',
        'wind': 'wind_new',
        'clouds': 'clouds_new'
    };
    
    return `https://tile.openweathermap.org/map/${layerMap[layer]}/{z}/{x}/{y}.png?appid=${API_KEY}`;
}

// Get weather by city name
async function getWeatherByCity(city) {
    try {
        console.log(`Fetching coordinates for city: ${city}`);
        
        // Get coordinates from city name
        const geoUrl = `${GEO_URL}/direct?q=${city}&limit=1&appid=${API_KEY}`;
        const geoData = await fetchWithErrorHandling(geoUrl, 'Geo');
        
        if (geoData.length === 0) {
            alert('City not found. Please try another city.');
            hideLoader();
            return;
        }
        
        const { lat, lon, name, country } = geoData[0];
        currentCity = name;
        currentCoords = { lat, lon };
        
        // Get weather data
        await getWeatherData(lat, lon, name, country);
    } catch (error) {
        console.error('Error fetching weather by city:', error);
        
        // Try alternative API key if the error seems to be related to the API key
        if (error.message.includes('401') || error.message.includes('403')) {
            alert('API key issue detected. Please check your OpenWeatherMap API key.');
        } else if (error.message.includes('CORS') || error.message.includes('blocked')) {
            alert('CORS issue detected. Try enabling the CORS proxy in the script.js file.');
        } else {
            alert(`Failed to fetch weather data: ${error.message}. Please try again.`);
        }
        
        hideLoader();
    }
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon) {
    try {
        console.log(`Fetching city name for coordinates: ${lat}, ${lon}`);
        
        // Get city name from coordinates
        const geoUrl = `${GEO_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
        const geoData = await fetchWithErrorHandling(geoUrl, 'Reverse Geo');
        
        if (geoData.length === 0) {
            getWeatherByCity('London'); // Default city
            return;
        }
        
        const { name, country } = geoData[0];
        currentCity = name;
        currentCoords = { lat, lon };
        
        // Get weather data
        await getWeatherData(lat, lon, name, country);
    } catch (error) {
        console.error('Error fetching weather by coordinates:', error);
        getWeatherByCity('London'); // Default city
    }
}

// Get weather data
async function getWeatherData(lat, lon, cityName, countryCode) {
    try {
        console.log(`Fetching weather data for coordinates: ${lat}, ${lon} with unit: ${currentUnit}`);
        
        // Get current weather
        const weatherUrl = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`;
        console.log('Weather API URL:', weatherUrl);
        const weatherData = await fetchWithErrorHandling(weatherUrl, 'Weather');
        
        // Verify the temperature unit in the response
        console.log(`Received temperature: ${weatherData.main.temp} ${currentUnit === 'metric' ? '°C' : '°F'}`);
        
        // Get 5-day forecast
        const forecastUrl = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`;
        console.log('Forecast API URL:', forecastUrl);
        const forecastData = await fetchWithErrorHandling(forecastUrl, 'Forecast');
        
        // Get air quality data
        const airQualityUrl = `${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        const airQualityData = await fetchWithErrorHandling(airQualityUrl, 'Air Quality');
        
        // Combine all data
        const combinedData = {
            current: weatherData,
            forecast: forecastData,
            airQuality: airQualityData,
            city: cityName,
            country: countryCode
        };
        
        currentWeatherData = combinedData;
        
        // Update UI
        updateWeatherUI(combinedData);
        
        // Center map on location
        if (map) {
            map.setView([lat, lon], 10);
            
            // Add marker for the location
            L.marker([lat, lon]).addTo(map)
                .bindPopup(`<b>${cityName}, ${countryCode}</b><br>${weatherData.weather[0].description}`)
                .openPopup();
        }
        
        hideLoader();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        
        // Provide more specific error messages
        if (error.message.includes('401') || error.message.includes('403')) {
            alert('API key issue detected. Please check your OpenWeatherMap API key.');
        } else if (error.message.includes('CORS') || error.message.includes('blocked')) {
            alert('CORS issue detected. Try enabling the CORS proxy in the script.js file.');
        } else {
            alert(`Failed to fetch weather data: ${error.message}. Please try again.`);
        }
        
        hideLoader();
    }
}

// Update weather UI
function updateWeatherUI(data) {
    const { current, forecast, airQuality, city, country } = data;
    
    console.log('Updating UI with unit:', currentUnit);
    console.log('Current weather data:', current);
    
    // Update current weather
    cityEl.textContent = city;
    countryEl.textContent = country;
    dateEl.textContent = formatDate(new Date());
    
    const temp = Math.round(current.main.temp);
    const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
    console.log(`Temperature: ${temp}${tempUnit}`);
    tempEl.textContent = `${temp}${tempUnit}`;
    
    const tempHi = Math.round(current.main.temp_max);
    const tempLo = Math.round(current.main.temp_min);
    tempHiEl.textContent = `${tempHi}${tempUnit}`;
    tempLoEl.textContent = `${tempLo}${tempUnit}`;
    
    const iconCode = current.weather[0].icon;
    weatherIconEl.src = `${WEATHER_ICON_URL}${iconCode}@2x.png`;
    weatherDescEl.textContent = current.weather[0].description;
    
    const feelsLike = Math.round(current.main.feels_like);
    feelsLikeEl.textContent = `${feelsLike}${tempUnit}`;
    
    humidityEl.textContent = `${current.main.humidity}%`;
    
    const windSpeed = current.wind.speed;
    const windUnit = currentUnit === 'metric' ? 'm/s' : 'mph';
    windEl.textContent = `${windSpeed} ${windUnit}`;
    
    pressureEl.textContent = `${current.main.pressure} hPa`;
    
    // Update phone animation data
    updatePhoneWeatherData(city, temp, tempUnit, current.main.humidity, windSpeed, windUnit, current.weather[0].main);
    
    // Update forecast
    updateForecast(forecast);
    
    // Update air quality
    updateAirQuality(airQuality);
    
    // Update sun and moon info
    updateSunMoonInfo(current);
    
    // Apply weather background
    applyWeatherBackground(current.weather[0].main);
    
    // Update animation based on weather
    updateWeatherAnimation(current.weather[0].main);
    
    // Add animation classes
    document.querySelectorAll('.weather-card, .forecast-container, .weather-map, .additional-info')
        .forEach(el => {
            el.classList.add('fade-in');
            setTimeout(() => el.classList.remove('fade-in'), 500);
        });
}

// Update phone weather data
function updatePhoneWeatherData(city, temp, tempUnit, humidity, windSpeed, windUnit, weatherMain) {
    // Update phone location and date
    const phoneLocationEl = document.getElementById('phone-location');
    const phoneDateEl = document.getElementById('phone-date');
    const phoneTempEl = document.getElementById('phone-temp');
    const phoneHumidityEl = document.getElementById('phone-humidity');
    const phoneWindEl = document.getElementById('phone-wind');
    const phoneUvEl = document.getElementById('phone-uv');
    
    if (phoneLocationEl) phoneLocationEl.textContent = city;
    if (phoneDateEl) phoneDateEl.textContent = formatDate(new Date(), true);
    if (phoneTempEl) phoneTempEl.textContent = `${temp}${tempUnit}`;
    if (phoneHumidityEl) phoneHumidityEl.textContent = `${humidity}%`;
    if (phoneWindEl) phoneWindEl.textContent = `${windSpeed} ${windUnit}`;
    
    // Set a random UV index for demonstration
    const uvIndex = Math.floor(Math.random() * 10) + 1;
    if (phoneUvEl) phoneUvEl.textContent = `UV ${uvIndex}`;
    
    // Hide all weather icons first
    document.querySelectorAll('.phone-weather-icon').forEach(icon => {
        icon.style.display = 'none';
    });
    
    // Show the appropriate weather icon
    let iconClass = 'sunny'; // default
    switch(weatherMain.toLowerCase()) {
        case 'clear':
            iconClass = 'sunny';
            break;
        case 'clouds':
            iconClass = 'cloudy';
            break;
        case 'rain':
        case 'drizzle':
            iconClass = 'rainy';
            break;
        case 'snow':
            iconClass = 'snowy';
            break;
        default:
            iconClass = 'sunny';
    }
    
    const activeIcon = document.querySelector(`.phone-weather-icon.${iconClass}`);
    if (activeIcon) activeIcon.style.display = 'block';
}

// Update forecast
function updateForecast(forecastData) {
    forecastContainerEl.innerHTML = '';
    
    // Group forecast by day (every 8 items = 1 day as data is in 3-hour intervals)
    const dailyForecasts = [];
    const forecastItems = forecastData.list;
    
    // Get one forecast per day (at noon)
    const today = new Date().setHours(0, 0, 0, 0);
    
    for (let i = 0; i < forecastItems.length; i++) {
        const forecastDate = new Date(forecastItems[i].dt * 1000);
        const forecastDay = forecastDate.setHours(0, 0, 0, 0);
        
        // Skip today
        if (forecastDay === today) continue;
        
        // Check if we already have this day
        const existingDay = dailyForecasts.findIndex(f => {
            const fDate = new Date(f.dt * 1000);
            return fDate.setHours(0, 0, 0, 0) === forecastDay;
        });
        
        if (existingDay === -1) {
            dailyForecasts.push(forecastItems[i]);
        }
        
        // Stop after 5 days
        if (dailyForecasts.length === 5) break;
    }
    
    // Create forecast cards
    dailyForecasts.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayDate = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        
        const temp = Math.round(forecast.main.temp);
        const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
        
        const iconCode = forecast.weather[0].icon;
        const description = forecast.weather[0].description;
        
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card slide-in';
        forecastCard.innerHTML = `
            <div class="date">${dayName}, ${dayDate}</div>
            <img src="${WEATHER_ICON_URL}${iconCode}.png" alt="${description}">
            <div class="temp">${temp}${tempUnit}</div>
            <div class="description">${description}</div>
        `;
        
        forecastContainerEl.appendChild(forecastCard);
    });
}

// Update air quality
function updateAirQuality(airQualityData) {
    const aqi = airQualityData.list[0].main.aqi;
    let aqiLabel = '';
    let aqiColor = '';
    
    switch (aqi) {
        case 1:
            aqiLabel = 'Good';
            aqiColor = '#4caf50';
            break;
        case 2:
            aqiLabel = 'Fair';
            aqiColor = '#8bc34a';
            break;
        case 3:
            aqiLabel = 'Moderate';
            aqiColor = '#ffeb3b';
            break;
        case 4:
            aqiLabel = 'Poor';
            aqiColor = '#ff9800';
            break;
        case 5:
            aqiLabel = 'Very Poor';
            aqiColor = '#f44336';
            break;
        default:
            aqiLabel = 'Unknown';
            aqiColor = '#9e9e9e';
    }
    
    aqiValueEl.textContent = aqi;
    aqiValueEl.style.color = aqiColor;
    aqiLabelEl.textContent = aqiLabel;
    aqiLabelEl.style.color = aqiColor;
}

// Update sun and moon info
function updateSunMoonInfo(weatherData) {
    // Sun info
    const sunrise = new Date(weatherData.sys.sunrise * 1000);
    const sunset = new Date(weatherData.sys.sunset * 1000);
    
    sunriseEl.textContent = formatTime(sunrise);
    sunsetEl.textContent = formatTime(sunset);
    
    // Moon phase (approximation)
    const now = new Date();
    const daysSinceNewMoon = getMoonPhase(now);
    const phase = getMoonPhaseInfo(daysSinceNewMoon);
    
    moonPhaseEl.textContent = phase.name;
    moonIconEl.innerHTML = `<i class="${phase.icon}"></i>`;
}

// Apply weather background
function applyWeatherBackground(weatherMain) {
    const weatherCard = document.querySelector('.weather-card');
    const animationContainer = document.querySelector('.weather-animation-container');
    
    // Remove all weather classes
    weatherCard.classList.remove('clear-sky', 'clouds', 'rain', 'snow', 'thunderstorm', 'mist');
    
    // Add appropriate class
    switch (weatherMain.toLowerCase()) {
        case 'clear':
            weatherCard.classList.add('clear-sky');
            // Set real background image for clear weather
            animationContainer.style.backgroundImage = 'url("backgrounds/clear.jpg")';
            break;
        case 'clouds':
            weatherCard.classList.add('clouds');
            // Set real background image for cloudy weather
            animationContainer.style.backgroundImage = 'url("backgrounds/clouds.jpg")';
            break;
        case 'rain':
        case 'drizzle':
            weatherCard.classList.add('rain');
            // Set real background image for rainy weather
            animationContainer.style.backgroundImage = 'url("backgrounds/rain.jpg")';
            break;
        case 'snow':
            weatherCard.classList.add('snow');
            // Set real background image for snowy weather
            animationContainer.style.backgroundImage = 'url("backgrounds/snow.jpg")';
            break;
        case 'thunderstorm':
            weatherCard.classList.add('thunderstorm');
            // Use rain background for thunderstorm
            animationContainer.style.backgroundImage = 'url("backgrounds/rain.jpg")';
            break;
        case 'mist':
        case 'fog':
        case 'haze':
            weatherCard.classList.add('mist');
            // Use cloudy background for mist/fog
            animationContainer.style.backgroundImage = 'url("backgrounds/clouds.jpg")';
            break;
        default:
            // Default to clear sky
            weatherCard.classList.add('clear-sky');
            animationContainer.style.backgroundImage = 'url("backgrounds/clear.jpg")';
    }
    
    // Add background styling
    animationContainer.style.backgroundSize = 'cover';
}

// Update weather animation based on current weather
function updateWeatherAnimation(weatherMain) {
    const animationContainer = document.querySelector('.weather-animation-container');
    const rainContainer = document.querySelector('.rain-container');
    const cloudsContainer = document.querySelector('.clouds-container');
    const sun = document.querySelector('.sun');
    
    // Reset all weather-specific classes
    animationContainer.classList.remove('rain-bg', 'snow-bg', 'clear-bg', 'clouds-bg');
    
    // Hide all weather elements
    rainContainer.style.opacity = '0';
    cloudsContainer.style.opacity = '0';
    sun.style.opacity = '0';
    
    // Apply appropriate animation based on weather
    switch(weatherMain.toLowerCase()) {
        case 'clear':
            animationContainer.classList.add('clear-bg');
            sun.style.opacity = '1';
            break;
        case 'clouds':
            animationContainer.classList.add('clouds-bg');
            cloudsContainer.style.opacity = '1';
            break;
        case 'rain':
        case 'drizzle':
            animationContainer.classList.add('rain-bg');
            rainContainer.style.opacity = '1';
            cloudsContainer.style.opacity = '1';
            break;
        case 'snow':
            animationContainer.classList.add('snow-bg');
            cloudsContainer.style.opacity = '1';
            // Add snowflakes instead of raindrops
            addSnowflakes();
            break;
        default:
            animationContainer.classList.add('clear-bg');
            sun.style.opacity = '1';
    }
}

// Add snowflakes for snow weather
function addSnowflakes() {
    const rainContainer = document.querySelector('.rain-container');
    rainContainer.innerHTML = '';
    
    for (let i = 0; i < 12; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.style.left = `${Math.random() * 100}%`;
        snowflake.style.animationDelay = `${Math.random() * 2}s`;
        rainContainer.appendChild(snowflake);
    }
    
    rainContainer.style.opacity = '1';
}

// Helper Functions

// Format date
function formatDate(date, short = false) {
    if (short) {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }
    
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format time
function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// Get moon phase (0-29.5 days)
function getMoonPhase(date) {
    // Approximation of days since new moon on Jan 6, 2000
    const newMoonRef = new Date(2000, 0, 6).getTime();
    const daysSinceRef = (date.getTime() - newMoonRef) / (1000 * 60 * 60 * 24);
    const lunarCycle = 29.53; // days
    
    return (daysSinceRef % lunarCycle);
}

// Get moon phase info
function getMoonPhaseInfo(daysSinceNewMoon) {
    const phases = [
        { name: 'New Moon', icon: 'fas fa-moon', maxDays: 1 },
        { name: 'Waxing Crescent', icon: 'fas fa-moon', maxDays: 6.38 },
        { name: 'First Quarter', icon: 'fas fa-moon', maxDays: 8.38 },
        { name: 'Waxing Gibbous', icon: 'fas fa-moon', maxDays: 13.76 },
        { name: 'Full Moon', icon: 'fas fa-moon', maxDays: 15.77 },
        { name: 'Waning Gibbous', icon: 'fas fa-moon', maxDays: 21.14 },
        { name: 'Last Quarter', icon: 'fas fa-moon', maxDays: 23.14 },
        { name: 'Waning Crescent', icon: 'fas fa-moon', maxDays: 29.53 }
    ];
    
    for (const phase of phases) {
        if (daysSinceNewMoon <= phase.maxDays) {
            return phase;
        }
    }
    
    return phases[0]; // Default to new moon
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
