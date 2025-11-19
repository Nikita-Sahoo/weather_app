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