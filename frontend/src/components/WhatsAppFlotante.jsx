import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './WhatsAppFlotante.css';

const WhatsAppFlotante = () => {
    const [telefono, setTelefono] = useState(null);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL}/api/banner/`)
            .then(res => {
                if (res.data && res.data.telefono) {
                    setTelefono(res.data.telefono);
                }
            })
            .catch(err => console.error("Error cargando teléfono WhatsApp:", err));
    }, []);

    if (!telefono) return null;

    const numeroLimpio = telefono.toString().replace(/\D/g, '');
    const numeroFinal = numeroLimpio.startsWith('54') ? numeroLimpio : `549${numeroLimpio}`;

    return (
        <a
            href={`https://wa.me/${numeroFinal}`}
            className="whatsapp-float"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat de WhatsApp"
        >
            <i className="fa-brands fa-whatsapp"></i>
        </a>
    );
};

export default WhatsAppFlotante;