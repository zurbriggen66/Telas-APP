import React from 'react';
import {   Mail, MapPin, Phone } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer-container">
            <div className="footer-content">
                
                {/* Columna 1: Marca y Descripción */}
                <div className="footer-brand">
                    <h2 className="footer-logo">Telas APP</h2>
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
                        <li><a href="/favoritas">Favoritas</a></li>
                        <li><a href="/contacto">Contacto</a></li>
                    </ul>
                </div>

                {/* Columna 3: Contacto y Retiro */}
                <div className="footer-contact">
                    <h3>Contacto</h3>
                    <ul>
                        <li>
                            <MapPin size={18} />
                            <span>San Martín 123, Córdoba (Retiro en local)</span>
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
                            
                        </a>
                        <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                            
                        </a>
                    </div>
                </div>

            </div>

            {/* Línea divisoria y Copyright */}
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Telas APP. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
};

export default Footer;