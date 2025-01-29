// Environment-specific configuration
const config = {
  development: {
    apiUrl: '', // Empty string means same-origin requests
  },
  production: {
    apiUrl: import.meta.env.VITE_API_URL || '', // Use environment variable in production
  }
};

const environment = import.meta.env.MODE || 'development';

export const apiConfig = config[environment as keyof typeof config];