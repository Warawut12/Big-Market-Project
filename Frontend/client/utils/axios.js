import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://big-market-project.onrender.com",
});

export default API;