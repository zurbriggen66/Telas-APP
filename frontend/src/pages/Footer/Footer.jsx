import React, { useState, useEffect } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import axios from 'axios';
import './Footer.css';

const Footer = () => {
    const [logoUrl, setLogoUrl] = useState(null);

    // Buscamos el logo desde la API (igual que en el Home)
    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const res = await axios.get(import.meta.env.VITE_API_URL + '/api/banner/');
                if (res.data && res.data.logo) {
                    setLogoUrl(res.data.logo);
                }
            } catch (error) {
                console.error('Error cargando el logo en el footer:', error);
            }
        };
        fetchLogo();
    }, []);

    return (
        <footer className="footer-container">
            <div className="footer-content">
                
                {/* Columna 1: Marca (Logo Dinámico) y Descripción */}
                <div className="footer-brand">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo Ale Armando" className="footer-logo-img" />
                    ) : (
                        <h2 className="footer-logo">Ale Armando</h2>
                    )}
                    <p className="footer-description">
                        Descubrí nuestra última selección de telas importadas. 
                        Lino, seda, algodón pima y más — todo con la calidad que nos distingue.
                    </p>
                </div>

                {/* Columna 2: Links Rápidos */}
                <div className="footer-links">
                    <h3>Explorar</h3>
                    <ul>
                        <li><a href="/">Inicio</a></li>
                        <li><a href="/productos">Productos</a></li>
                    
                        <li><a href="/contacto">Contacto</a></li>
                    </ul>
                </div>

                {/* Columna 3: Contacto y Retiro */}
                <div className="footer-contact">
                    <h3>Contacto</h3>
                    <ul>
                        <li>
                            <MapPin size={18} />
                            <span>Jorge Newery 67, San Guillermo, Santa Fe</span>
                        </li>
                        <li>
                            <Phone size={18} />
                            <span>+54 9 3544 123456</span>
                        </li>
                        <li>
                            <Mail size={18} />
                            <span>ventas@telasapp.com</span>
                        </li>
                    </ul>
                </div>

                {/* Columna 4: Redes Sociales */}
                <div className="footer-social">
                    <h3>Seguinos</h3>
                    <div className="social-icons">
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                            {/* Reemplazamos el componente de Lucide por el SVG nativo */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                            </svg>
                        </a>
                    </div>
                </div>

            </div>

            {/* Línea divisoria y Copyright */}
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Ale Armando. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
};

export default Footer;