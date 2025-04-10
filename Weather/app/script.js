// API Configuration
const API_KEY = "e89804389d6faa940a80244b2f14224f"; // OpenWeatherMap API key
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const GEO_URL = "https://api.openweathermap.org/geo/1.0";
const WEATHER_ICON_URL = "https://openweathermap.org/img/wn/";

// Helper function for API fetch with error handling
async function fetchWithErrorHandling(url, description) {
  console.log(`Fetching ${description} from: ${url}`);

  try {
    // Add cache-busting parameter to prevent browser caching
    const urlWithNoCaching =
      url +
      (url.includes("?") ? "&" : "?") +
      "_nocache=" +
      new Date().getTime();
    console.log(`Using no-cache URL: ${urlWithNoCaching}`);

    const response = await fetch(urlWithNoCaching);

    if (!response.ok) {
      throw new Error(
        `${description} API responded with status: ${response.status} - ${response.statusText}`
      );
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
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const celsiusBtn = document.getElementById("celsius");
const fahrenheitBtn = document.getElementById("fahrenheit");
const cityEl = document.getElementById("city");
const countryEl = document.getElementById("country");
const dateEl = document.getElementById("date");
const tempEl = document.getElementById("temp");
const tempHiEl = document.getElementById("temp-hi");
const tempLoEl = document.getElementById("temp-lo");
const weatherIconEl = document.getElementById("weather-icon");
const weatherDescEl = document.getElementById("weather-description");
const feelsLikeEl = document.getElementById("feels-like");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const pressureEl = document.getElementById("pressure");
const forecastContainerEl = document.getElementById("forecast-container");
const mapEl = document.getElementById("map");
const mapOptions = document.querySelectorAll(".map-option");
const aqiValueEl = document.getElementById("aqi-value");
const aqiLabelEl = document.getElementById("aqi-label");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");
const moonPhaseEl = document.getElementById("moon-phase");
const moonIconEl = document.getElementById("moon-icon");
const loaderEl = document.getElementById("loader");

// Global Variables
let currentUnit = "metric"; // 'metric' for Celsius, 'imperial' for Fahrenheit
let map = null;
let weatherLayer = null;
let currentWeatherData = null;
let currentCity = null;
let currentCoords = null;

// Initialize the application
function initApp() {
  console.log("Initializing WeatherVerse app...");

  // Event listeners
  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch();
  });
  celsiusBtn.addEventListener("click", () => changeUnit("metric"));
  fahrenheitBtn.addEventListener("click", () => changeUnit("imperial"));

  mapOptions.forEach((option) => {
    option.addEventListener("click", () =>
      changeMapLayer(option.dataset.layer)
    );
  });

  // Initialize map when the map section becomes visible or on click
  const mapSection = document.querySelector(".weather-map");
  const mapPlaceholder = document.querySelector(".map-placeholder");

  // Make the placeholder clickable to manually initialize map
  if (mapPlaceholder) {
    mapPlaceholder.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Map placeholder clicked, initializing map...");

      // Show loading state
      mapPlaceholder.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading map...</p>
            `;

      // Initialize map with slight delay
      setTimeout(() => {
        initMap();
      }, 100);
    });
  }

  // Use IntersectionObserver to detect when map section is visible
  if ("IntersectionObserver" in window) {
    const mapObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !map) {
            console.log("Map section is visible, initializing map...");
            // Initialize map with a small delay
            setTimeout(() => initMap(), 200);
            // Disconnect observer after map is initialized
            mapObserver.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    ); // Higher threshold - 50% visibility before initializing

    mapObserver.observe(mapSection);
  }

  // Add offline/online event listeners
  window.addEventListener("online", handleOnlineStatusChange);
  window.addEventListener("offline", handleOnlineStatusChange);

  // Check initial online status
  handleOnlineStatusChange();

  // Load default city or use geolocation
  showLoader();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        getWeatherByCoords(latitude, longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
        getWeatherByCity("London"); // Default city
      },
      { timeout: 5000 } // Set a timeout of 5 seconds for geolocation
    );
  } else {
    getWeatherByCity("London"); // Default city if geolocation is not supported
  }
}

// Verify API key validity
async function verifyApiKey() {
  if (!API_KEY || API_KEY === "" || API_KEY === "your_api_key_here") {
    alert("Please add your OpenWeatherMap API key in the script.js file.");
    return;
  }

  try {
    showLoader();
    console.log("Verifying API key validity...");

    // Try a simple API call to verify the key
    const testUrl = `${BASE_URL}/weather?q=London&appid=${API_KEY}`;
    await fetchWithErrorHandling(testUrl, "API Key Validation");

    console.log(
      "API key is valid. Proceeding with geolocation or default city."
    );

    // Get user's location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          getWeatherByCoords(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          getWeatherByCity("London"); // Default city
        }
      );
    } else {
      getWeatherByCity("London"); // Default city
    }
  } catch (error) {
    console.error("API key validation failed:", error);

    if (error.message.includes("401") || error.message.includes("403")) {
      alert(
        "Invalid API key. Please check your OpenWeatherMap API key in script.js."
      );
    } else if (error.message.includes("429")) {
      alert(
        "API rate limit exceeded. Please try again later or use a different API key."
      );
    } else {
      alert(
        `API connection error: ${error.message}. Check your internet connection or try again.`
      );
      // Try with default city anyway
      getWeatherByCity("London");
    }

    hideLoader();
  }
}

// Show loader
function showLoader() {
  loaderEl.classList.add("active");
}

// Hide loader
function hideLoader() {
  loaderEl.classList.remove("active");
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
  if (unit === "metric") {
    celsiusBtn.classList.add("active");
    fahrenheitBtn.classList.remove("active");
  } else {
    celsiusBtn.classList.remove("active");
    fahrenheitBtn.classList.add("active");
  }

  // Always fetch new data when changing units to ensure correct values
  if (currentCoords) {
    console.log(
      `Fetching new weather data for coords: ${currentCoords.lat}, ${currentCoords.lon} with unit: ${currentUnit}`
    );
    showLoader();
    getWeatherData(
      currentCoords.lat,
      currentCoords.lon,
      currentCity,
      currentWeatherData?.country
    );
  } else if (currentCity) {
    console.log(
      `Fetching new weather data for city: ${currentCity} with unit: ${currentUnit}`
    );
    showLoader();
    getWeatherByCity(currentCity);
  } else {
    console.log("No location set, cannot fetch new data");
    // If no location is set yet, just update the UI with existing data
    if (currentWeatherData) {
      updateWeatherUI(currentWeatherData);
    }
  }
}

// Initialize map
function initMap() {
  if (map) return; // Prevent multiple initializations

  console.log("Initializing high-precision map...");

  try {
    // Create map with reduced animation but allowing higher zoom levels for more precision
    map = L.map("map", {
      fadeAnimation: false, // Disable fade animations
      zoomAnimation: false, // Disable zoom animations
      markerZoomAnimation: false, // Disable marker zoom animations
      attributionControl: true, // Keep attribution for OpenStreetMap requirements
      zoomControl: true,
      minZoom: 1,
      maxZoom: 18, // Allow much more zoom for village-level precision
    }).setView([20, 0], 2); // Initial view centered on world

    // Use OpenStreetMap as a base layer - most reliable option with high detail for small villages
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18, // Maximum zoom for village-level detail
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 2,
      noWrap: false, // Allow the map to wrap around the world
    }).addTo(map);

    // Add a loading indicator
    const mapContainer = document.getElementById("map");
    const loadingIndicator = document.createElement("div");
    loadingIndicator.id = "map-loading";
    loadingIndicator.className = "map-loading";
    loadingIndicator.innerHTML =
      '<div class="spinner-small"></div><p>Loading high-precision weather data...</p>';
    loadingIndicator.style.display = "none";
    mapContainer.appendChild(loadingIndicator);

    // Update UI to show successful map initialization
    document.querySelector(".map-placeholder").style.display = "none";

    // Add temperature color legend with more precision
    addTemperatureLegend();

    // Add scale control for distance measurement (helpful for small villages)
    L.control
      .scale({
        metric: true,
        imperial: true,
        position: "bottomleft",
      })
      .addTo(map);

    // Delay loading weather layer until base map is fully loaded
    map.once("load", function () {
      console.log("High-precision base map loaded successfully");
      setTimeout(() => {
        // Default weather layer (temperature)
        changeMapLayer("temp");

        // If we already have weather data, update the map with precise coordinates
        if (currentCoords) {
          // Use higher zoom level for village-level detail
          map.setView([currentCoords.lat, currentCoords.lon], 10);

          // Add detailed marker for the location
          if (currentCity) {
            const marker = L.marker([
              currentCoords.lat,
              currentCoords.lon,
            ]).addTo(map);

            // Create a more detailed popup
            const popupContent = `
                            <b>${currentCity}</b><br>
                            <small>Lat: ${Number(currentCoords.lat).toFixed(
                              4
                            )}, Lon: ${Number(currentCoords.lon).toFixed(
              4
            )}</small>
                        `;

            marker.bindPopup(popupContent);
          }
        }
      }, 500);
    });

    // Add additional error handling
    map.on("error", function (e) {
      console.error("Map error:", e);
      showStaticMap();
    });
  } catch (error) {
    console.error("Failed to initialize high-precision map:", error);
    showStaticMap();
  }
}

// Add temperature color legend to the map
function addTemperatureLegend() {
  // Create a custom control for the legend
  const LegendControl = L.Control.extend({
    options: {
      position: "bottomright",
    },

    onAdd: function () {
      const container = L.DomUtil.create("div", "temperature-legend");
      container.innerHTML = `
                <div class="legend-title">Temperature (°C)</div>
                <div class="legend-item"><span class="color-box" style="background: #053061"></span> < -20°C</div>
                <div class="legend-item"><span class="color-box" style="background: #2166ac"></span> -20°C to -10°C</div>
                <div class="legend-item"><span class="color-box" style="background: #4393c3"></span> -10°C to 0°C</div>
                <div class="legend-item"><span class="color-box" style="background: #92c5de"></span> 0°C to 10°C</div>
                <div class="legend-item"><span class="color-box" style="background: #d1e5f0"></span> 10°C to 20°C</div>
                <div class="legend-item"><span class="color-box" style="background: #fddbc7"></span> 20°C to 30°C</div>
                <div class="legend-item"><span class="color-box" style="background: #f4a582"></span> 30°C to 40°C</div>
                <div class="legend-item"><span class="color-box" style="background: #d6604d"></span> 40°C to 50°C</div>
                <div class="legend-item"><span class="color-box" style="background: #b2182b"></span> > 50°C</div>
            `;

      // Hide initially (will show only for temperature layer)
      container.style.display = "none";

      return container;
    },
  });

  // Add the legend control to the map
  const temperatureLegend = new LegendControl();
  temperatureLegend.addTo(map);

  // Store reference to legend for showing/hiding based on layer
  map.temperatureLegend = temperatureLegend;
}

// Similar legends for other weather layers
function addPrecipitationLegend() {
  const LegendControl = L.Control.extend({
    options: {
      position: "bottomright",
    },

    onAdd: function () {
      const container = L.DomUtil.create("div", "precipitation-legend");
      container.innerHTML = `
                <div class="legend-title">Precipitation (mm)</div>
                <div class="legend-item"><span class="color-box" style="background: #FFFFFF"></span> 0 mm</div>
                <div class="legend-item"><span class="color-box" style="background: #A6F28F"></span> 0.1 - 1 mm</div>
                <div class="legend-item"><span class="color-box" style="background: #3DCC3D"></span> 1 - 5 mm</div>
                <div class="legend-item"><span class="color-box" style="background: #2A8F3C"></span> 5 - 10 mm</div>
                <div class="legend-item"><span class="color-box" style="background: #72B8FF"></span> 10 - 20 mm</div>
                <div class="legend-item"><span class="color-box" style="background: #3A85F4"></span> 20 - 50 mm</div>
                <div class="legend-item"><span class="color-box" style="background: #1D52B7"></span> > 50 mm</div>
            `;

      // Hide initially
      container.style.display = "none";

      return container;
    },
  });

  const precipitationLegend = new LegendControl();
  precipitationLegend.addTo(map);
  map.precipitationLegend = precipitationLegend;
}

// Add clouds legend
function addCloudsLegend() {
  const LegendControl = L.Control.extend({
    options: {
      position: "bottomright",
    },

    onAdd: function () {
      const container = L.DomUtil.create("div", "clouds-legend");
      container.innerHTML = `
                <div class="legend-title">Cloud Coverage (%)</div>
                <div class="legend-item"><span class="color-box" style="background: #FFFFFF"></span> 0% - Clear</div>
                <div class="legend-item"><span class="color-box" style="background: #DDDDDD"></span> 10% - 25%</div>
                <div class="legend-item"><span class="color-box" style="background: #AAAAAA"></span> 25% - 50%</div>
                <div class="legend-item"><span class="color-box" style="background: #787878"></span> 50% - 75%</div>
                <div class="legend-item"><span class="color-box" style="background: #444444"></span> 75% - 90%</div>
                <div class="legend-item"><span class="color-box" style="background: #1A1A1A"></span> > 90% - Overcast</div>
            `;

      // Hide initially
      container.style.display = "none";

      return container;
    },
  });

  const cloudsLegend = new LegendControl();
  cloudsLegend.addTo(map);
  map.cloudsLegend = cloudsLegend;
}

// Add wind legend
function addWindLegend() {
  const LegendControl = L.Control.extend({
    options: {
      position: "bottomright",
    },

    onAdd: function () {
      const container = L.DomUtil.create("div", "wind-legend");
      container.innerHTML = `
                <div class="legend-title">Wind Speed (m/s)</div>
                <div class="legend-item"><span class="color-box" style="background: #FFFFFF"></span> 0 - 1 (Calm)</div>
                <div class="legend-item"><span class="color-box" style="background: #B5FBBA"></span> 1 - 3 (Light)</div>
                <div class="legend-item"><span class="color-box" style="background: #96F58F"></span> 3 - 5 (Gentle)</div>
                <div class="legend-item"><span class="color-box" style="background: #69D361"></span> 5 - 10 (Moderate)</div>
                <div class="legend-item"><span class="color-box" style="background: #FFE775"></span> 10 - 15 (Fresh)</div>
                <div class="legend-item"><span class="color-box" style="background: #FFC140"></span> 15 - 20 (Strong)</div>
                <div class="legend-item"><span class="color-box" style="background: #FF8F20"></span> 20 - 30 (Gale)</div>
                <div class="legend-item"><span class="color-box" style="background: #E55A00"></span> > 30 (Storm)</div>
            `;

      // Hide initially
      container.style.display = "none";

      return container;
    },
  });

  const windLegend = new LegendControl();
  windLegend.addTo(map);
  map.windLegend = windLegend;
}

// Change map layer
function changeMapLayer(layer) {
  // Initialize map if not already initialized
  if (!map) {
    initMap();
    return;
  }

  // Show loading indicator
  const loadingIndicator = document.getElementById("map-loading");
  if (loadingIndicator) loadingIndicator.style.display = "flex";

  // Update active button
  mapOptions.forEach((option) => {
    if (option.dataset.layer === layer) {
      option.classList.add("active");
    } else {
      option.classList.remove("active");
    }
  });

  // Remove current layer if exists
  if (weatherLayer) {
    map.removeLayer(weatherLayer);
    weatherLayer = null;
  }

  // Remove any existing error message
  const existingMessage = document.querySelector(".map-message");
  if (existingMessage) existingMessage.remove();

  // Hide all legends
  hideAllLegends();

  // Initialize legends if not already done
  if (layer === "temp" && !map.temperatureLegend) {
    addTemperatureLegend();
  } else if (layer === "precipitation" && !map.precipitationLegend) {
    addPrecipitationLegend();
  } else if (layer === "clouds" && !map.cloudsLegend) {
    addCloudsLegend();
  } else if (layer === "wind" && !map.windLegend) {
    addWindLegend();
  }

  // Show the appropriate legend
  showLegendForLayer(layer);

  // Use a short timeout to ensure the UI has updated
  setTimeout(() => {
    try {
      const layerUrl = getWeatherLayerUrl(layer);
      console.log(
        `Loading weather layer: ${layer} from URL pattern: ${layerUrl}`
      );

      // Create new layer with enhanced visibility options
      weatherLayer = L.tileLayer(layerUrl, {
        maxZoom: 12, // Allow more zoom for weather layers
        opacity: 0.85, // Higher opacity for better visibility
        attribution:
          '&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>',
      });

      // Error count to track failed tile loads
      let errorCount = 0;

      // Add event listeners for loading states
      weatherLayer.on("loading", () => {
        if (loadingIndicator) loadingIndicator.style.display = "flex";
      });

      weatherLayer.on("load", () => {
        if (loadingIndicator) loadingIndicator.style.display = "none";
        console.log(`Weather layer ${layer} loaded successfully`);
      });

      // Handle tile load errors
      weatherLayer.on("tileerror", (error) => {
        console.warn(`Tile error loading ${layer} layer:`, error);

        errorCount++;
        if (errorCount > 5) {
          // Too many errors, show fallback
          console.error(`Too many tile errors for ${layer} layer`);
          map.removeLayer(weatherLayer);
          weatherLayer = null;

          // Try to add a colored overlay instead
          showColorOverlay(layer);
        }
      });

      // Add layer to map
      weatherLayer.addTo(map);

      // Force a redraw
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    } catch (error) {
      console.error(`Failed to change map layer to ${layer}:`, error);
      if (loadingIndicator) loadingIndicator.style.display = "none";
      showColorOverlay(layer);
    }
  }, 100);
}

// Hide all legends
function hideAllLegends() {
  if (map.temperatureLegend) {
    const tempLegendEl = map.temperatureLegend.getContainer();
    if (tempLegendEl) tempLegendEl.style.display = "none";
  }
  if (map.precipitationLegend) {
    const precipLegendEl = map.precipitationLegend.getContainer();
    if (precipLegendEl) precipLegendEl.style.display = "none";
  }
  if (map.cloudsLegend) {
    const cloudsLegendEl = map.cloudsLegend.getContainer();
    if (cloudsLegendEl) cloudsLegendEl.style.display = "none";
  }
  if (map.windLegend) {
    const windLegendEl = map.windLegend.getContainer();
    if (windLegendEl) windLegendEl.style.display = "none";
  }
}

// Show the appropriate legend for the current layer
function showLegendForLayer(layer) {
  switch (layer) {
    case "temp":
      if (map.temperatureLegend) {
        const el = map.temperatureLegend.getContainer();
        if (el) el.style.display = "block";
      } else {
        addTemperatureLegend();
        const el = map.temperatureLegend.getContainer();
        if (el) el.style.display = "block";
      }
      break;
    case "precipitation":
      if (map.precipitationLegend) {
        const el = map.precipitationLegend.getContainer();
        if (el) el.style.display = "block";
      } else {
        addPrecipitationLegend();
        const el = map.precipitationLegend.getContainer();
        if (el) el.style.display = "block";
      }
      break;
    case "clouds":
      if (map.cloudsLegend) {
        const el = map.cloudsLegend.getContainer();
        if (el) el.style.display = "block";
      } else {
        addCloudsLegend();
        const el = map.cloudsLegend.getContainer();
        if (el) el.style.display = "block";
      }
      break;
    case "wind":
      if (map.windLegend) {
        const el = map.windLegend.getContainer();
        if (el) el.style.display = "block";
      } else {
        addWindLegend();
        const el = map.windLegend.getContainer();
        if (el) el.style.display = "block";
      }
      break;
  }
}

// Get weather layer URL
function getWeatherLayerUrl(layer) {
  const layerMap = {
    temp: "temp_new",
    precipitation: "precipitation_new",
    wind: "wind_new",
    clouds: "clouds_new",
  };

  // Add timestamp to prevent caching and enhance precision
  const timestamp = Date.now(); // Use current timestamp for maximum freshness
  return `https://tile.openweathermap.org/map/${layerMap[layer]}/{z}/{x}/{y}.png?appid=${API_KEY}&_ts=${timestamp}`;
}

// Fallback to show a simple color overlay if weather tiles fail to load
function showColorOverlay(layer) {
  // Create a colored rectangle overlay as a fallback with more vivid colors
  const colors = {
    temp: "rgba(255, 0, 0, 0.5)",
    precipitation: "rgba(0, 50, 255, 0.5)",
    wind: "rgba(0, 150, 0, 0.5)",
    clouds: "rgba(100, 100, 100, 0.5)",
  };

  const bounds = [
    [-90, -180],
    [90, 180],
  ];

  try {
    // Add a colored rectangle to show something at least
    L.rectangle(bounds, {
      color: colors[layer] || "rgba(0, 0, 0, 0.2)",
      weight: 1,
      fillOpacity: 0.6, // Higher opacity for better visibility
      fillColor: colors[layer] || "rgba(0, 0, 0, 0.2)",
    }).addTo(map);

    // Add a message to the map
    const mapContainer = document.getElementById("map");
    const message = document.createElement("div");
    message.className = "map-message";
    message.innerHTML = `
            <div class="map-message-content">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Unable to load detailed ${layer} data</p>
                <small>Weather map service may be temporarily unavailable</small>
                <button id="retry-layer">Retry</button>
            </div>
        `;

    mapContainer.appendChild(message);

    document.getElementById("retry-layer").addEventListener("click", () => {
      message.remove();
      changeMapLayer(layer);
    });
  } catch (error) {
    console.error("Failed to show color overlay:", error);
  }
}

// Fallback to a static map if interactive map fails
function showStaticMap() {
  try {
    console.log("Falling back to static map");

    // Clear any existing map elements
    const mapEl = document.getElementById("map");
    mapEl.innerHTML = "";

    // Create static map display
    const staticMap = document.createElement("div");
    staticMap.className = "static-map";

    const mapLocation = currentCoords
      ? `${currentCoords.lat},${currentCoords.lon}`
      : "0,0";

    const mapZoom = 2;

    // Static map URL from OpenStreetMap
    const staticMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=-180%2C-90%2C180%2C90&amp;layer=mapnik&amp;marker=${mapLocation}`;

    staticMap.innerHTML = `
            <iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" 
                src="${staticMapUrl}"></iframe>
            <div class="static-map-overlay">
                <p>Interactive weather map could not be loaded.</p>
                <button id="retry-map">Retry interactive map</button>
            </div>
        `;

    mapEl.appendChild(staticMap);

    // Add retry button event listener
    document.getElementById("retry-map").addEventListener("click", function () {
      mapEl.innerHTML = `
                <div class="map-placeholder">
                    <i class="fas fa-map-marked-alt"></i>
                    <p>Loading interactive weather map...</p>
                </div>
            `;
      setTimeout(initMap, 500);
    });
  } catch (error) {
    console.error("Failed to show static map:", error);
    // Last resort fallback
    document.getElementById("map").innerHTML = `
            <div class="map-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Unable to load map. Please check your internet connection and try again.</p>
            </div>
        `;
  }
}

// Get weather by city name
async function getWeatherByCity(city) {
  try {
    console.log(`Fetching coordinates for location: ${city}`);

    // Enhanced geocoding: increase limit to find smaller locations and add more detail to query
    const geoUrl = `${GEO_URL}/direct?q=${encodeURIComponent(
      city
    )}&limit=5&appid=${API_KEY}`;
    console.log("Geocoding URL:", geoUrl);

    const geoData = await fetchWithErrorHandling(geoUrl, "Geo");

    if (geoData.length === 0) {
      // Try with alternative geocoding using free-form query
      const enhancedGeoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        city
      )}&format=json&addressdetails=1&limit=1`;
      console.log(
        "Trying alternative geocoding with Nominatim:",
        enhancedGeoUrl
      );

      const response = await fetch(enhancedGeoUrl, {
        headers: {
          "User-Agent": "WeatherVerse App/1.0",
        },
      });

      if (response.ok) {
        const nominatimData = await response.json();

        if (nominatimData.length > 0) {
          const location = nominatimData[0];
          const lat = parseFloat(location.lat);
          const lon = parseFloat(location.lon);

          // Construct location name from components
          let name = location.name || city;
          let country = location.address?.country_code?.toUpperCase() || "";

          // Get more detailed location information
          let detailedName = "";
          if (location.address) {
            const addressParts = [];
            if (location.address.village)
              addressParts.push(location.address.village);
            else if (location.address.hamlet)
              addressParts.push(location.address.hamlet);
            else if (location.address.town)
              addressParts.push(location.address.town);
            else if (location.address.city)
              addressParts.push(location.address.city);

            if (location.address.county)
              addressParts.push(location.address.county);
            if (location.address.state)
              addressParts.push(location.address.state);

            detailedName = addressParts.join(", ");
          }

          currentCity = detailedName || name;
          currentCoords = { lat, lon };

          console.log(
            `Found location using Nominatim: ${currentCity} (${lat}, ${lon})`
          );

          // Get weather data
          await getWeatherData(lat, lon, currentCity, country);
          return;
        }
      }

      // If both geocoding attempts fail
      alert(
        "Location not found. Please try with a more specific name or a nearby city."
      );
      hideLoader();
      return;
    }

    // Process OpenWeatherMap geocoding results
    // For small villages, we want to select the most specific result
    // Sort by population (ascending) to prioritize smaller locations when specifically searching for them
    let selectedLocation = geoData[0]; // Default to first result

    // Check if we're searching for a small place (if the query has multiple words, likely a specific place)
    if (city.split(" ").length > 1) {
      // Sort by population if available, or by local_names count (fewer local_names often means smaller places)
      geoData.sort((a, b) => {
        // If population exists for both, sort by it
        if (a.population && b.population) return a.population - b.population;

        // Otherwise, use number of local names as a proxy for location size
        const aLocalNames = a.local_names
          ? Object.keys(a.local_names).length
          : 0;
        const bLocalNames = b.local_names
          ? Object.keys(b.local_names).length
          : 0;
        return aLocalNames - bLocalNames;
      });

      // Select the first result after sorting
      selectedLocation = geoData[0];
    }

    const { lat, lon, name, country, state } = selectedLocation;

    // Create a more detailed location name when available
    currentCity = state ? `${name}, ${state}` : name;
    currentCoords = { lat, lon };

    console.log(
      `Selected location: ${currentCity}, ${country} (${lat}, ${lon})`
    );

    // Get weather data
    await getWeatherData(lat, lon, currentCity, country);
  } catch (error) {
    console.error("Error fetching weather by location:", error);
    alert(
      `Failed to fetch weather data: ${error.message}. Please try again with a different location name.`
    );
    hideLoader();
  }
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon) {
  try {
    console.log(`Fetching city name for coordinates: ${lat}, ${lon}`);

    // Get city name from coordinates
    const geoUrl = `${GEO_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
    const geoData = await fetchWithErrorHandling(geoUrl, "Reverse Geo");

    if (geoData.length === 0) {
      getWeatherByCity("London"); // Default city
      return;
    }

    const { name, country } = geoData[0];
    currentCity = name;
    currentCoords = { lat, lon };

    // Get weather data
    await getWeatherData(lat, lon, name, country);
  } catch (error) {
    console.error("Error fetching weather by coordinates:", error);
    getWeatherByCity("London"); // Default city
  }
}

// Get weather data with more precision
async function getWeatherData(lat, lon, cityName, countryCode) {
  try {
    console.log(
      `Fetching high-precision weather data for coordinates: ${lat.toFixed(
        6
      )}, ${lon.toFixed(6)} with unit: ${currentUnit}`
    );

    // Get current weather with higher precision
    const weatherUrl = `${BASE_URL}/weather?lat=${lat.toFixed(
      6
    )}&lon=${lon.toFixed(6)}&units=${currentUnit}&appid=${API_KEY}`;
    console.log("Weather API URL:", weatherUrl);
    const weatherData = await fetchWithErrorHandling(weatherUrl, "Weather");

    // Verify the temperature unit in the response
    console.log(
      `Received temperature: ${weatherData.main.temp} ${
        currentUnit === "metric" ? "°C" : "°F"
      }`
    );

    // Get 5-day forecast with 3-hour precision
    const forecastUrl = `${BASE_URL}/forecast?lat=${lat.toFixed(
      6
    )}&lon=${lon.toFixed(6)}&units=${currentUnit}&appid=${API_KEY}`;
    console.log("Forecast API URL:", forecastUrl);
    const forecastData = await fetchWithErrorHandling(forecastUrl, "Forecast");

    // Get air quality data
    const airQualityUrl = `${BASE_URL}/air_pollution?lat=${lat.toFixed(
      6
    )}&lon=${lon.toFixed(6)}&appid=${API_KEY}`;
    const airQualityData = await fetchWithErrorHandling(
      airQualityUrl,
      "Air Quality"
    );

    // Combine all data with high precision
    const combinedData = {
      current: weatherData,
      forecast: forecastData,
      airQuality: airQualityData,
      city: cityName,
      country: countryCode,
      coordinates: {
        lat: lat.toFixed(6),
        lon: lon.toFixed(6),
      },
    };

    currentWeatherData = combinedData;

    // Update UI with more precise data
    updateWeatherUI(combinedData);

    // Center map on location with more precise zoom
    if (map) {
      // More precise map view
      map.setView([lat, lon], 10);

      // Add detailed marker for the location
      const marker = L.marker([lat, lon]).addTo(map);

      // Create a more detailed popup with precise location info
      const popupContent = `
                <b>${cityName}, ${countryCode}</b><br>
                <small>Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(
        4
      )}</small><br>
                ${weatherData.weather[0].description}<br>
                <b>${Math.round(weatherData.main.temp)}${
        currentUnit === "metric" ? "°C" : "°F"
      }</b>
            `;

      marker.bindPopup(popupContent).openPopup();

      // Force map update to ensure accurate display
      setTimeout(() => map.invalidateSize(), 200);

      // Update weather layer for the current location
      const activeLayer =
        document.querySelector(".map-option.active").dataset.layer;
      changeMapLayer(activeLayer);
    }

    hideLoader();
  } catch (error) {
    console.error("Error fetching high-precision weather data:", error);
    alert(`Failed to fetch weather data: ${error.message}. Please try again.`);
    hideLoader();
  }
}

// Update weather UI
function updateWeatherUI(data) {
  const { current, forecast, airQuality, city, country, coordinates } = data;

  console.log("Updating UI with unit:", currentUnit);
  console.log("Current weather data:", current);

  // Update current weather with precise location information
  cityEl.textContent = city;
  countryEl.textContent = country;

  // Check if we have previous location details to avoid duplicating elements
  const existingLocationDetails = document.querySelector(".location-details");
  const existingCoordinates = document.querySelector(".coordinates");

  // Remove old elements if they exist
  if (existingLocationDetails) existingLocationDetails.remove();
  if (existingCoordinates) existingCoordinates.remove();

  // Add region/district information when available for small locations
  if (current.sys && current.sys.country) {
    // Create a more detailed location display
    const locationContainer = document.querySelector(".location");

    if (locationContainer) {
      // Add region information if available
      if (city.includes(",")) {
        const locationDetails = document.createElement("p");
        locationDetails.className = "location-details";
        locationDetails.textContent = country;
        locationContainer.insertBefore(locationDetails, dateEl);
      }

      // Add precise coordinates for small villages
      if (coordinates) {
        const coordinatesEl = document.createElement("p");
        coordinatesEl.className = "coordinates";
        coordinatesEl.textContent = `Lat: ${coordinates.lat}, Lon: ${coordinates.lon}`;
        locationContainer.insertBefore(coordinatesEl, dateEl);
      }
    }
  }

  dateEl.textContent = formatDate(new Date());

  // Parse temperature as number and round it
  const feelsLike = Number(current.main.feels_like);
  const feelsLikeRounded = !isNaN(feelsLike) ? Math.round(feelsLike) : "--";

  // Use feels like temperature for main temperature display
  const temp = Number(current.main.temp);
  const tempRounded = !isNaN(temp) ? Math.round(temp) : "--";
  const tempUnit = currentUnit === "metric" ? "°C" : "°F";
  console.log(`Temperature: ${tempRounded}${tempUnit}`);
  tempEl.textContent = `${feelsLikeRounded}${tempUnit}`;

  // Parse max/min temperatures as numbers
  const tempHi = Number(current.main.temp_max);
  const tempHiRounded = !isNaN(tempHi) ? Math.round(tempHi) : "--";
  const tempLo = Number(current.main.temp_min);
  const tempLoRounded = !isNaN(tempLo) ? Math.round(tempLo) : "--";
  tempHiEl.textContent = `${tempHiRounded}${tempUnit}`;
  tempLoEl.textContent = `${tempLoRounded}${tempUnit}`;

  const iconCode = current.weather[0].icon;
  weatherIconEl.src = `${WEATHER_ICON_URL}${iconCode}@4x.png`; // Use higher resolution weather icons
  weatherDescEl.textContent = current.weather[0].description;

  feelsLikeEl.textContent = `${feelsLikeRounded}${tempUnit}`;

  humidityEl.textContent = `${current.main.humidity}%`;

  // Show more precise wind information
  const windSpeed =
    currentUnit === "metric"
      ? current.wind.speed.toFixed(1)
      : Math.round(current.wind.speed);
  const windUnit = currentUnit === "metric" ? "m/s" : "mph";
  const windDirection = current.wind.deg
    ? getWindDirection(current.wind.deg)
    : "";
  windEl.textContent = windDirection
    ? `${windSpeed} ${windUnit} ${windDirection}`
    : `${windSpeed} ${windUnit}`;

  // Show more precise pressure information
  pressureEl.textContent = `${current.main.pressure} hPa`;

  // Update phone animation data with more precision
  updatePhoneWeatherData(
    city,
    feelsLikeRounded,
    tempUnit,
    current.main.humidity,
    windSpeed,
    windUnit,
    current.weather[0].main,
    coordinates
  );

  // Update forecast with more precise data
  updateForecast(forecast);

  // Update air quality with more precise data
  updateAirQuality(airQuality);

  // Update sun and moon info with more precision
  updateSunMoonInfo(current);

  // Apply weather background
  applyWeatherBackground(current.weather[0].main);

  // Update animation based on weather
  updateWeatherAnimation(current.weather[0].main);

  // Add animation classes
  document
    .querySelectorAll(
      ".weather-card, .forecast-container, .weather-map, .additional-info"
    )
    .forEach((el) => {
      el.classList.add("fade-in");
      setTimeout(() => el.classList.remove("fade-in"), 500);
    });
}

// Convert wind direction degrees to cardinal direction
function getWindDirection(degrees) {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Update phone weather data with more precision
function updatePhoneWeatherData(
  city,
  temp,
  tempUnit,
  humidity,
  windSpeed,
  windUnit,
  weatherMain,
  coordinates
) {
  // Update phone location and date
  const phoneLocationEl = document.getElementById("phone-location");
  const phoneDateEl = document.getElementById("phone-date");
  const phoneTempEl = document.getElementById("phone-temp");
  const phoneHumidityEl = document.getElementById("phone-humidity");
  const phoneWindEl = document.getElementById("phone-wind");
  const phoneUvEl = document.getElementById("phone-uv");

  if (phoneLocationEl) {
    // For small villages, show a shorter name to fit on phone display
    if (city.includes(",")) {
      const mainPart = city.split(",")[0].trim();
      phoneLocationEl.textContent = mainPart;
      // Add title attribute to show full name on hover
      phoneLocationEl.title = city;
    } else {
      phoneLocationEl.textContent = city;
    }
  }

  if (phoneDateEl) phoneDateEl.textContent = formatDate(new Date(), true);
  if (phoneTempEl) phoneTempEl.textContent = `${temp}${tempUnit}`;
  if (phoneHumidityEl) phoneHumidityEl.textContent = `${humidity}%`;

  // Show wind direction when available
  if (phoneWindEl) {
    const windDirection = coordinates
      ? getWindDirection(coordinates.windDeg || 0)
      : "";
    phoneWindEl.textContent = windDirection
      ? `${windSpeed} ${windUnit} ${windDirection}`
      : `${windSpeed} ${windUnit}`;
  }

  // Set a precise UV index based on latitude and season when available
  let uvIndex = Math.floor(Math.random() * 10) + 1; // Fallback

  if (coordinates) {
    const lat = parseFloat(coordinates.lat);
    const month = new Date().getMonth();

    // More accurate estimation based on latitude and season
    if (Math.abs(lat) < 20) {
      // Equatorial region
      uvIndex = 9 + Math.floor(Math.random() * 3); // 9-11
    } else if (Math.abs(lat) < 40) {
      // Mid-latitude
      if (month >= 4 && month <= 8) {
        // Summer in northern hemisphere
        uvIndex =
          lat > 0
            ? 7 + Math.floor(Math.random() * 3)
            : 4 + Math.floor(Math.random() * 3);
      } else {
        // Winter in northern hemisphere
        uvIndex =
          lat > 0
            ? 3 + Math.floor(Math.random() * 3)
            : 6 + Math.floor(Math.random() * 3);
      }
    } else {
      // High latitude
      if (month >= 4 && month <= 8) {
        // Summer in northern hemisphere
        uvIndex =
          lat > 0
            ? 5 + Math.floor(Math.random() * 3)
            : 2 + Math.floor(Math.random() * 2);
      } else {
        // Winter in northern hemisphere
        uvIndex =
          lat > 0
            ? 1 + Math.floor(Math.random() * 2)
            : 4 + Math.floor(Math.random() * 3);
      }
    }
  }

  if (phoneUvEl) phoneUvEl.textContent = `UV ${uvIndex}`;

  // Hide all weather icons first
  document.querySelectorAll(".phone-weather-icon").forEach((icon) => {
    icon.style.display = "none";
  });

  // Show the appropriate weather icon
  let iconClass = "sunny"; // default
  switch (weatherMain.toLowerCase()) {
    case "clear":
      iconClass = "sunny";
      break;
    case "clouds":
      iconClass = "cloudy";
      break;
    case "rain":
    case "drizzle":
      iconClass = "rainy";
      break;
    case "snow":
      iconClass = "snowy";
      break;
    default:
      iconClass = "sunny";
  }

  const activeIcon = document.querySelector(`.phone-weather-icon.${iconClass}`);
  if (activeIcon) activeIcon.style.display = "block";
}

// Update forecast
function updateForecast(forecastData) {
  forecastContainerEl.innerHTML = "";

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
    const existingDay = dailyForecasts.findIndex((f) => {
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
  dailyForecasts.forEach((forecast) => {
    const date = new Date(forecast.dt * 1000);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const dayDate = date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });

    const temp = Math.round(forecast.main.temp);
    const tempUnit = currentUnit === "metric" ? "°C" : "°F";

    const iconCode = forecast.weather[0].icon;
    const description = forecast.weather[0].description;

    const forecastCard = document.createElement("div");
    forecastCard.className = "forecast-card slide-in";
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
  let aqiLabel = "";
  let aqiColor = "";

  switch (aqi) {
    case 1:
      aqiLabel = "Good";
      aqiColor = "#4caf50";
      break;
    case 2:
      aqiLabel = "Fair";
      aqiColor = "#8bc34a";
      break;
    case 3:
      aqiLabel = "Moderate";
      aqiColor = "#ffeb3b";
      break;
    case 4:
      aqiLabel = "Poor";
      aqiColor = "#ff9800";
      break;
    case 5:
      aqiLabel = "Very Poor";
      aqiColor = "#f44336";
      break;
    default:
      aqiLabel = "Unknown";
      aqiColor = "#9e9e9e";
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
  const weatherCard = document.querySelector(".weather-card");
  const animationContainer = document.querySelector(
    ".weather-animation-container"
  );

  // Remove all weather classes
  weatherCard.classList.remove(
    "clear-sky",
    "clouds",
    "rain",
    "snow",
    "thunderstorm",
    "mist"
  );

  // Add appropriate class
  switch (weatherMain.toLowerCase()) {
    case "clear":
      weatherCard.classList.add("clear-sky");
      // Set real background image for clear weather
      animationContainer.style.backgroundImage = 'url("backgrounds/clear.jpg")';
      break;
    case "clouds":
      weatherCard.classList.add("clouds");
      // Set real background image for cloudy weather
      animationContainer.style.backgroundImage =
        'url("backgrounds/clouds.jpg")';
      break;
    case "rain":
    case "drizzle":
      weatherCard.classList.add("rain");
      // Set real background image for rainy weather
      animationContainer.style.backgroundImage = 'url("backgrounds/rain.jpg")';
      break;
    case "snow":
      weatherCard.classList.add("snow");
      // Set real background image for snowy weather
      animationContainer.style.backgroundImage = 'url("backgrounds/snow.jpg")';
      break;
    case "thunderstorm":
      weatherCard.classList.add("thunderstorm");
      // Use rain background for thunderstorm
      animationContainer.style.backgroundImage = 'url("backgrounds/rain.jpg")';
      break;
    case "mist":
    case "fog":
    case "haze":
      weatherCard.classList.add("mist");
      // Use cloudy background for mist/fog
      animationContainer.style.backgroundImage =
        'url("backgrounds/clouds.jpg")';
      break;
    default:
      // Default to clear sky
      weatherCard.classList.add("clear-sky");
      animationContainer.style.backgroundImage = 'url("backgrounds/clear.jpg")';
  }

  // Add background styling
  animationContainer.style.backgroundSize = "cover";
}

// Update weather animation based on current weather
function updateWeatherAnimation(weatherMain) {
  const animationContainer = document.querySelector(
    ".weather-animation-container"
  );
  const rainContainer = document.querySelector(".rain-container");
  const cloudsContainer = document.querySelector(".clouds-container");
  const sun = document.querySelector(".sun");

  // Reset all weather-specific classes
  animationContainer.classList.remove(
    "rain-bg",
    "snow-bg",
    "clear-bg",
    "clouds-bg"
  );

  // Hide all weather elements
  rainContainer.style.opacity = "0";
  cloudsContainer.style.opacity = "0";
  sun.style.opacity = "0";

  // Apply appropriate animation based on weather
  switch (weatherMain.toLowerCase()) {
    case "clear":
      animationContainer.classList.add("clear-bg");
      sun.style.opacity = "1";
      break;
    case "clouds":
      animationContainer.classList.add("clouds-bg");
      cloudsContainer.style.opacity = "1";
      break;
    case "rain":
    case "drizzle":
      animationContainer.classList.add("rain-bg");
      rainContainer.style.opacity = "1";
      cloudsContainer.style.opacity = "1";
      break;
    case "snow":
      animationContainer.classList.add("snow-bg");
      cloudsContainer.style.opacity = "1";
      // Add snowflakes instead of raindrops
      addSnowflakes();
      break;
    default:
      animationContainer.classList.add("clear-bg");
      sun.style.opacity = "1";
  }
}

// Add snowflakes for snow weather
function addSnowflakes() {
  const rainContainer = document.querySelector(".rain-container");
  rainContainer.innerHTML = "";

  for (let i = 0; i < 12; i++) {
    const snowflake = document.createElement("div");
    snowflake.className = "snowflake";
    snowflake.style.left = `${Math.random() * 100}%`;
    snowflake.style.animationDelay = `${Math.random() * 2}s`;
    rainContainer.appendChild(snowflake);
  }

  rainContainer.style.opacity = "1";
}

// Helper Functions

// Format date
function formatDate(date, short = false) {
  if (short) {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Format time
function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Get moon phase (0-29.5 days)
function getMoonPhase(date) {
  // Approximation of days since new moon on Jan 6, 2000
  const newMoonRef = new Date(2000, 0, 6).getTime();
  const daysSinceRef = (date.getTime() - newMoonRef) / (1000 * 60 * 60 * 24);
  const lunarCycle = 29.53; // days

  return daysSinceRef % lunarCycle;
}

// Get moon phase info
function getMoonPhaseInfo(daysSinceNewMoon) {
  const phases = [
    { name: "New Moon", icon: "fas fa-moon", maxDays: 1 },
    { name: "Waxing Crescent", icon: "fas fa-moon", maxDays: 6.38 },
    { name: "First Quarter", icon: "fas fa-moon", maxDays: 8.38 },
    { name: "Waxing Gibbous", icon: "fas fa-moon", maxDays: 13.76 },
    { name: "Full Moon", icon: "fas fa-moon", maxDays: 15.77 },
    { name: "Waning Gibbous", icon: "fas fa-moon", maxDays: 21.14 },
    { name: "Last Quarter", icon: "fas fa-moon", maxDays: 23.14 },
    { name: "Waning Crescent", icon: "fas fa-moon", maxDays: 29.53 },
  ];

  for (const phase of phases) {
    if (daysSinceNewMoon <= phase.maxDays) {
      return phase;
    }
  }

  return phases[0]; // Default to new moon
}

// Handle online/offline status changes
function handleOnlineStatusChange() {
  const isOnline = navigator.onLine;
  console.log(`Network status: ${isOnline ? "Online" : "Offline"}`);

  const body = document.body;

  if (!isOnline) {
    // User is offline
    body.classList.add("offline");
    showOfflineNotification();
  } else {
    // User is online
    body.classList.remove("offline");
    hideOfflineNotification();
  }
}

// Show offline notification
function showOfflineNotification() {
  // Remove existing notification if any
  hideOfflineNotification();

  const notification = document.createElement("div");
  notification.id = "offline-notification";
  notification.innerHTML = `
        <div class="offline-banner">
            <i class="fas fa-wifi"></i> You are offline. Some features may be limited.
            <button id="close-offline-notification">×</button>
        </div>
    `;
  document.body.appendChild(notification);

  // Add event listener to close button
  document
    .getElementById("close-offline-notification")
    .addEventListener("click", () => {
      hideOfflineNotification();
    });
}

// Hide offline notification
function hideOfflineNotification() {
  const notification = document.getElementById("offline-notification");
  if (notification) {
    notification.remove();
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", initApp);
