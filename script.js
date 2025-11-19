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

