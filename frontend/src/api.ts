import axios from 'axios';

const api = axios.create({
    baseURL: 'http://15.206.73.143/api',
});

export default api;
