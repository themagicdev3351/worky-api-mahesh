export const config = {
  env: {
    uri: process.env.NODE_ENV === 'development' ? process.env.MONGO_URI_TEST : process.env.MONGO_URI,
    baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8080",
  },
};