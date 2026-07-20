// Usamos tu dominio real de PythonAnywhere como URL por defecto
const API_URL = import.meta.env.VITE_API_URL || 'https://www.modaytelas.store/api';

export const fetchTrackingStatus = async (trackingNumber) => {
    try {
        // MAGIA ACÁ: Le quitamos el /api si ya lo trae, para poder agregarlo nosotros de forma segura
        const baseUrlLimpia = API_URL.replace(/\/api\/?$/, '').replace(/\/$/, ''); 
        
        // Armamos la ruta forzando que SIEMPRE tenga /api/rastrear/...
        const response = await fetch(`${baseUrlLimpia}/api/rastrear/${trackingNumber}/`);
        
        if (!response.ok) {
            throw new Error('No se pudo encontrar información para este número de envío.');
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error al rastrear:", error);
        throw error;
    }
};