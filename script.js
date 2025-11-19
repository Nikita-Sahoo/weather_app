// Configuration - API key is loaded from config.js
const API_KEY = CONFIG.WEATHER_API_KEY;
const BASE_URL = CONFIG.BASE_URL;

// Global state
let currentUnit = 'celsius';
let currentWeatherData = null;
let isFirstLoad = true;

// DOM Elements
const elements = {
    cityInput: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    locationBtn: document.getElementById('locationBtn'),
    recentCities: document.getElementById('recentCities'),
    currentWeather: document.getElementById('currentWeather'),
    extendedForecast: document.getElementById('extendedForecast'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    errorModal: document.getElementById('errorModal'),
    errorMessage: document.getElementById('errorMessage'),
    locationStatus: document.getElementById('locationStatus'),
    locationStatusText: document.getElementById('locationStatusText'),
    celsiusBtn: document.getElementById('celsiusBtn'),
    fahrenheitBtn: document.getElementById('fahrenheitBtn')
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌤️ WeatherCast Pro Initialized');
    setupEventListeners();
    loadRecentCities();
    
    // Automatically get current location weather on page load
    setTimeout(() => {
        getCurrentLocationWeather();
    }, 500); // Small delay to ensure everything is loaded
});

// Event Listeners
function setupEventListeners() {
    // Prevent form submission and page reload
    elements.searchBtn.addEventListener('click', function(e) {
        e.preventDefault();
        handleSearch();
    });
    
    elements.locationBtn.addEventListener('click', function(e) {
        e.preventDefault();
        getCurrentLocationWeather();
    });
    
    elements.cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    });
    
    elements.cityInput.addEventListener('input', handleInputChange);
    elements.cityInput.addEventListener('focus', showRecentCities);
    
    elements.celsiusBtn.addEventListener('click', function(e) {
        e.preventDefault();
        switchTemperatureUnit('celsius');
    });
    
    elements.fahrenheitBtn.addEventListener('click', function(e) {
        e.preventDefault();
        switchTemperatureUnit('fahrenheit');
    });
    
    document.getElementById('closeError').addEventListener('click', hideError);
    document.getElementById('confirmError').addEventListener('click', hideError);
    
    document.addEventListener('click', (e) => {
        if (!elements.cityInput.contains(e.target) && !elements.recentCities.contains(e.target)) {
            elements.recentCities.classList.add('hidden');
        }
    });
}


// Search functionality
async function handleSearch() {
    const city = elements.cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    if (!/^[a-zA-Z\s,-]+$/.test(city)) {
        showError('Please enter a valid city name (letters, spaces, and hyphens only)');
        return;
    }
    
    await fetchWeatherData(city);
}

// Fetch weather data by city name
async function fetchWeatherData(city) {
    showLoading(`Searching for ${city}...`);
    
    try {
        const currentResponse = await fetch(
            `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
        );
        
        if (!currentResponse.ok) {
            if (currentResponse.status === 404) {
                throw new Error('City not found. Please check the spelling.');
            } else if (currentResponse.status === 401) {
                throw new Error('Invalid API key. Please check your configuration.');
            } else {
                throw new Error('Weather service unavailable. Please try again later.');
            }
        }
        
        const currentData = await currentResponse.json();
        
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
        );
        
        if (!forecastResponse.ok) {
            throw new Error('Could not fetch forecast data.');
        }
        
        const forecastData = await forecastResponse.json();
        
        currentWeatherData = { current: currentData, forecast: forecastData };
        displayWeatherData(currentWeatherData);
        addToRecentCities(city);
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

// Fetch weather data by city name
async function fetchWeatherData(city) {
    showLoading(`Searching for ${city}...`);
    
    try {
        const currentResponse = await fetch(
            `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
        );
        
        if (!currentResponse.ok) {
            if (currentResponse.status === 404) {
                throw new Error('City not found. Please check the spelling.');
            } else if (currentResponse.status === 401) {
                throw new Error('Invalid API key. Please check your configuration.');
            } else {
                throw new Error('Weather service unavailable. Please try again later.');
            }
        }
        
        const currentData = await currentResponse.json();
        
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
        );
        
        if (!forecastResponse.ok) {
            throw new Error('Could not fetch forecast data.');
        }
        
        const forecastData = await forecastResponse.json();
        
        currentWeatherData = { current: currentData, forecast: forecastData };
        displayWeatherData(currentWeatherData);
        addToRecentCities(city);
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}


// Get current location weather (used on page load and button click)
function getCurrentLocationWeather() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        // Fallback to default city
        fetchWeatherData('London');
        return;
    }
    
    if (isFirstLoad) {
        showLoading('Detecting your location...');
    } else {
        showLoading('Getting your current location...');
    }
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            await fetchWeatherByCoords(latitude, longitude);
            isFirstLoad = false;
        },
        (error) => {
            hideLoading();
            handleGeolocationError(error);
            isFirstLoad = false;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 600000 // 10 minutes cache
        }
    );
}

// Handle geolocation errors
function handleGeolocationError(error) {
    let errorMessage = '';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access or search by city name.';
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please try again or search by city name.';
            break;
        case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        default:
            errorMessage = 'An unknown error occurred while getting location.';
    }
    
    // Show error but don't prevent the app from working
    console.warn('Location error:', errorMessage);
    
    // Fallback to a default city on first load
    if (isFirstLoad) {
        showLoading('Loading default weather...');
        setTimeout(() => {
            fetchWeatherData('London');
        }, 1000);
    } else {
        showError(errorMessage);
    }
}

// Fetch weather by coordinates
async function fetchWeatherByCoords(lat, lon) {
    showLoading('Fetching weather data...');
    
    try {
        const currentResponse = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        
        if (!currentResponse.ok) {
            throw new Error('Could not fetch weather data for your location.');
        }
        
        const currentData = await currentResponse.json();
        
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        
        if (!forecastResponse.ok) {
            throw new Error('Could not fetch forecast data for your location.');
        }
        
        const forecastData = await forecastResponse.json();
        
        currentWeatherData = { current: currentData, forecast: forecastData };
        displayWeatherData(currentWeatherData);
        addToRecentCities(currentData.name);
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

// Display weather data
function displayWeatherData(data) {
    displayCurrentWeather(data.current);
    displayExtendedForecast(data.forecast);
    updateWeatherBackground(data.current.weather[0].main);
    
    // Show sections with smooth animation
    setTimeout(() => {
        elements.currentWeather.classList.remove('hidden');
        elements.extendedForecast.classList.remove('hidden');
        elements.currentWeather.classList.add('fade-in');
    }, 100);
}

// Display current weather
function displayCurrentWeather(data) {
    document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    
    document.getElementById('weatherDescription').textContent = data.weather[0].description;
    updateTemperatureDisplay(data.main.temp);
    document.getElementById('windSpeed').textContent = data.wind.speed;
    document.getElementById('humidity').textContent = data.main.humidity;
    document.getElementById('pressure').textContent = data.main.pressure;
    
    const feelsLikeTemp = currentUnit === 'celsius' ? 
        data.main.feels_like : 
        celsiusToFahrenheit(data.main.feels_like);
    document.getElementById('feelsLike').textContent = Math.round(feelsLikeTemp);
    
    const icon = getWeatherIcon(data.weather[0].main, data.weather[0].description);
    document.getElementById('weatherIcon').textContent = icon;
    
    checkWeatherAlerts(data.main.temp);
}

// Display extended forecast
function displayExtendedForecast(data) {
    const forecastContainer = elements.extendedForecast;
    forecastContainer.innerHTML = '';
    
    const dailyForecasts = [];
    const processedDays = new Set();
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!processedDays.has(date) && dailyForecasts.length < 5) {
            processedDays.add(date);
            dailyForecasts.push(item);
        }
    });
    
    dailyForecasts.forEach((forecast, index) => {
        const date = new Date(forecast.dt * 1000);
        const card = createForecastCard(forecast, date, index);
        forecastContainer.appendChild(card);
    });
}

// Create forecast card
function createForecastCard(forecast, date, index) {
    const card = document.createElement('div');
    card.className = 'forecast-card bg-white/20 backdrop-blur-md p-4 rounded-xl text-center fade-in';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const temp = currentUnit === 'celsius' ? forecast.main.temp : celsiusToFahrenheit(forecast.main.temp);
    const icon = getWeatherIcon(forecast.weather[0].main, forecast.weather[0].description);
    
    card.innerHTML = `
        <h3 class="font-bold text-white">${date.toLocaleDateString('en-US', { weekday: 'short' })}</h3>
        <p class="text-white/70 text-sm mb-2">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
        <div class="text-4xl my-3 weather-icon">${icon}</div>
        <p class="text-xl font-bold text-white mb-1">${Math.round(temp)}°${currentUnit === 'celsius' ? 'C' : 'F'}</p>
        <p class="text-white/90 capitalize text-sm mb-3">${forecast.weather[0].description}</p>
        <div class="flex justify-between text-xs text-white/80">
            <span><i class="fas fa-tint mr-1"></i>${forecast.main.humidity}%</span>
            <span><i class="fas fa-wind mr-1"></i>${forecast.wind.speed} m/s</span>
        </div>
    `;
    
    return card;
}

// Recent cities functionality
function loadRecentCities() {
    return JSON.parse(localStorage.getItem('recentCities') || '[]');
}

// Recent cities functionality
function loadRecentCities() {
    return JSON.parse(localStorage.getItem('recentCities') || '[]');
}

function saveRecentCities(cities) {
    localStorage.setItem('recentCities', JSON.stringify(cities));
}

function addToRecentCities(city) {
    let recent = loadRecentCities();
    recent = recent.filter(c => c.toLowerCase() !== city.toLowerCase());
    recent.unshift(city);
    if (recent.length > 5) recent = recent.slice(0, 5);
    saveRecentCities(recent);
    updateRecentCitiesDropdown(recent);
}

function updateRecentCitiesDropdown(cities) {
    elements.recentCities.innerHTML = '';
    if (cities.length === 0) {
        elements.recentCities.classList.add('hidden');
        return;
    }
    
    cities.forEach(city => {
        const cityElement = document.createElement('div');
        cityElement.className = 'px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 text-gray-800';
        cityElement.textContent = city;
        cityElement.addEventListener('click', () => {
            elements.cityInput.value = city;
            elements.recentCities.classList.add('hidden');
            handleSearch();
        });
        elements.recentCities.appendChild(cityElement);
    });
}

function handleInputChange() {
    const recent = loadRecentCities();
    const filtered = recent.filter(city => 
        city.toLowerCase().includes(elements.cityInput.value.toLowerCase())
    );
    
    if (filtered.length > 0 && elements.cityInput.value) {
        updateRecentCitiesDropdown(filtered);
    } else {
        elements.recentCities.classList.add('hidden');
    }
}

function showRecentCities() {
    const recent = loadRecentCities();
    if (recent.length > 0) {
        updateRecentCitiesDropdown(recent);
        elements.recentCities.classList.remove('hidden');
    }
}

// Temperature unit conversion
function switchTemperatureUnit(unit) {
    if (unit === currentUnit) return;
    currentUnit = unit;
    
    if (unit === 'celsius') {
        elements.celsiusBtn.className = 'flex-1 py-2 rounded-lg bg-blue-600 text-white transition-colors font-semibold';
        elements.fahrenheitBtn.className = 'flex-1 py-2 rounded-lg text-white hover:bg-white/20 transition-colors font-semibold';
    } else {
        elements.celsiusBtn.className = 'flex-1 py-2 rounded-lg text-white hover:bg-white/20 transition-colors font-semibold';
        elements.fahrenheitBtn.className = 'flex-1 py-2 rounded-lg bg-blue-600 text-white transition-colors font-semibold';
    }
    
    if (currentWeatherData) {
        updateTemperatureDisplay(currentWeatherData.current.main.temp);
        const feelsLikeTemp = unit === 'celsius' ? 
            currentWeatherData.current.main.feels_like : 
            celsiusToFahrenheit(currentWeatherData.current.main.feels_like);
        document.getElementById('feelsLike').textContent = Math.round(feelsLikeTemp);
        displayExtendedForecast(currentWeatherData.forecast);
    }
}

function updateTemperatureDisplay(tempCelsius) {
    const temp = currentUnit === 'celsius' ? tempCelsius : celsiusToFahrenheit(tempCelsius);
    document.getElementById('tempValue').textContent = Math.round(temp);
    document.getElementById('tempUnit').textContent = `°${currentUnit === 'celsius' ? 'C' : 'F'}`;
}

function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}
