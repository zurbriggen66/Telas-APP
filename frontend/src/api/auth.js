import axios from 'axios';

const API = import.meta.env.VITE_API_URL;
const ACCESS_KEY = 'ta_access';
const REFRESH_KEY = 'ta_refresh';

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);
export const isAuthenticated = () => !!getAccessToken();

const setTokens = ({ access, refresh }) => {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
};

const clearTokens = () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
};

export const login = async (username, password) => {
    const { data } = await axios.post(`${API}/api/token/`, { username, password });
    setTokens(data);
};

export const logout = () => {
    clearTokens();
    window.location.href = '/dashboard/login';
};

// Todas las páginas del admin llaman a la API con axios o con fetch nativo.
// En vez de tocar cada llamada una por una, adjuntamos el token acá, en un
// solo lugar, para las dos formas de pedir datos.
axios.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const token = getAccessToken();
    if (token && url.startsWith(API)) {
        init = { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` } };
    }
    return nativeFetch(input, init);
};

// Si el access token venció, lo refrescamos una vez; si el refresh también
// falla, mandamos al usuario a loguearse de nuevo.
let refreshing = null;
axios.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        const esRefresh = original?.url?.includes('/api/token/refresh/');
        if (error.response?.status === 401 && esRefresh) {
            clearTokens();
            window.location.href = '/dashboard/login';
            return Promise.reject(error);
        }
        if (error.response?.status === 401 && getAccessToken() && !original._retried) {
            original._retried = true;
            try {
                refreshing = refreshing || axios.post(`${API}/api/token/refresh/`, { refresh: getRefreshToken() });
                const { data } = await refreshing;
                refreshing = null;
                setTokens({ access: data.access });
                original.headers.Authorization = `Bearer ${data.access}`;
                return axios(original);
            } catch {
                refreshing = null;
                clearTokens();
                window.location.href = '/dashboard/login';
            }
        }
        return Promise.reject(error);
    }
);
