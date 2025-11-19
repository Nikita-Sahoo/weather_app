// Configuration management for environment variables
class WeatherConfig {
    constructor() {
        this.API_KEY = null;
        this.BASE_URL = 'https://api.openweathermap.org/data/2.5';
        this.SERVER_URL = 'http://localhost:3001'; // Updated to use port 3001
        this.init();
    }

    async init() {
        await this.loadConfig();
    }

    async loadConfig() {
        try {
            console.log('🔄 Loading configuration from server...');
            
            // Try to load from environment-specific endpoint
            const response = await fetch(`${this.SERVER_URL}/api/config`);
            
            if (response.ok) {
                const config = await response.json();
                this.API_KEY = config.OPENWEATHER_API_KEY;
                console.log('✅ Configuration loaded successfully from server');
                console.log('🔑 API Key:', this.API_KEY ? '✓ Loaded' : '✗ Missing');
            } else {
                throw new Error(`Server responded with status: ${response.status}`);
            }
        } catch (error) {
            console.warn('⚠️ Could not load config from server:', error.message);
            console.log('🔧 Attempting fallback configuration methods...');
            this.loadFromFallback();
        }
    }

    loadFromFallback() {
        // Method 1: Check for global variable
        if (typeof window !== 'undefined' && window.WEATHER_CONFIG) {
            this.API_KEY = window.WEATHER_CONFIG.API_KEY;
            console.log('✅ Configuration loaded from global variable');
            return;
        }

        // Method 2: Check for config.json file
        this.tryLoadFromConfigFile();

        if (!this.API_KEY) {
            console.error('❌ No configuration found. Please check your setup.');
            this.showSetupInstructions();
        }
    }

    async tryLoadFromConfigFile() {
        try {
            const response = await fetch('/config.json');
            if (response.ok) {
                const config = await response.json();
                this.API_KEY = config.API_KEY;
                console.log('✅ Configuration loaded from config.json');
            }
        } catch (error) {
            // config.json not available
        }
    }

    showSetupInstructions() {
        console.log(`
📋 SETUP INSTRUCTIONS:
    
Option 1: Using .env file (Recommended)
    - Make sure your .env file contains: OPENWEATHER_API_KEY=your_api_key_here
    - The server should automatically serve this
    
Option 2: Using config.json
    - Create a config.json file in your project root:
      {
          "API_KEY": "your_api_key_here"
      }
    
Option 3: Using global variable
    - Add this to your HTML before config.js:
      <script>
        window.WEATHER_CONFIG = { API_KEY: "your_api_key_here" };
      </script>
        `);
    }

    getApiKey() {
        if (!this.API_KEY) {
            const errorMessage = `
🚫 API Configuration Error

The application cannot find a valid API key. Please ensure one of these is set up:

1. .env file with OPENWEATHER_API_KEY=your_key
2. config.json file with API_KEY
3. window.WEATHER_CONFIG global variable

Current server: ${this.SERVER_URL}
            `;
            throw new Error(errorMessage);
        }
        return this.API_KEY;
    }

    getBaseUrl() {
        return this.BASE_URL;
    }

    // Validate configuration
    isValid() {
        return this.API_KEY !== null && this.API_KEY !== undefined && this.API_KEY !== '';
    }

    // Get configuration status for debugging
    getStatus() {
        return {
            hasApiKey: !!this.API_KEY,
            serverUrl: this.SERVER_URL,
            baseUrl: this.BASE_URL,
            isValid: this.isValid()
        };
    }
}

// Create global instance
const weatherConfig = new WeatherConfig();