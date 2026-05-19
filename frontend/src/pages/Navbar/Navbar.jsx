import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Store, User, X, ChevronRight, ArrowUpDown, ChevronDown } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ cartCount = 0 }) => {
    // 1. ESTADOS
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [logoUrl, setLogoUrl] = useState(null);
    
    // ESTADOS PARA DESPLEGABLE A-Z
    const [telasAZ, setTelasAZ] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileAzOpen, setIsMobileAzOpen] = useState(false);

    // 2. FUNCIONES
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    
    const closeMenu = () => {
        setIsMenuOpen(false);
        setIsMobileAzOpen(false); // Cierra también el acordeón al cerrar el menú
    };

    // 3. EFECTOS (Llamadas a la API y eventos)
    useEffect(() => {
        // Cargar el Logo del banner
        axios.get('http://127.0.0.1:8000/api/banner/')
            .then(res => { if (res.data?.logo) setLogoUrl(res.data.logo); })
            .catch(() => {});

        // Cargar las telas para el menú A-Z
        axios.get('http://127.0.0.1:8000/api/productos-az/')
            .then(res => setTelasAZ(res.data))
            .catch(err => console.error("Error cargando telas A-Z", err));
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') closeMenu(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isMenuOpen]);

    return (
        <>
            <nav className={`atelier-navbar ${scrolled ? 'scrolled' : ''}`}>
                <div className="navbar-container">

                    {/* MENÚ MÓVIL (HAMBURGUESA) */}
                    <button className="mobile-menu-btn" onClick={toggleMenu} aria-label="Menú">
                        <span className={`hamburger-icon ${isMenuOpen ? 'open' : ''}`}>
                            <span /><span /><span />
                        </span>
                    </button>

                    {/* LOGO */}
                    <Link to="/" className="navbar-logo" onClick={closeMenu}>
                        {logoUrl 
                            ? <img src={logoUrl} alt="Logo Telas" className="logo-img" />
                            : <div className="logo-fallback"><Store size={22} /><span className="logo-text">TELAS<span>APP</span></span></div>
                        }
                    </Link>

                    {/* LINKS DE ESCRITORIO */}
                    <div className="navbar-links">
                        <Link to="/" className="nav-link">Inicio</Link>
                        <Link to="/productos" className="nav-link">Productos</Link>
                        
                        {/* MODIFICACIÓN 1: DESPLEGABLE DESKTOP */}
                        <div 
                            className="nav-dropdown-container"
                            onMouseEnter={() => setIsDropdownOpen(true)}
                            onMouseLeave={() => setIsDropdownOpen(false)}
                        >
                            <span className="nav-link nav-link--az" style={{ cursor: 'pointer' }}>
                                <ArrowUpDown size={14} strokeWidth={1.5} /> A–Z
                            </span>
                            
                            {isDropdownOpen && (
                                <div className="dropdown-menu">
                                    {telasAZ.length > 0 ? (
                                        telasAZ.map(tela => (
                                            <Link 
                                                key={tela.id} 
                                                to={`/producto/${tela.id}`} 
                                                className="dropdown-item"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                {tela.nombre}
                                            </Link>
                                        ))
                                    ) : (
                                        <span className="dropdown-item">Cargando...</span>
                                    )}
                                </div>
                            )}
                        </div>
                        
                    </div>

                    {/* ACCIONES (USUARIO Y CARRITO) */}
                    <div className="navbar-actions">
                        <Link to="/cuenta" className="icon-btn" aria-label="Mi cuenta">
                            <User size={22} strokeWidth={1.5} />
                        </Link>
                        <Link to="/carrito" className="icon-btn cart-btn" aria-label="Carrito">
                            <ShoppingCart size={22} strokeWidth={1.5} />
                            {cartCount > 0 && (
                                <span className="cart-badge">
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </nav>

            {/* OVERLAY FONDO OSCURO */}
            <div className={`mobile-overlay ${isMenuOpen ? 'active' : ''}`} onClick={closeMenu} />

            {/* CAJÓN MENÚ LATERAL (DRAWER) */}
            <aside className={`mobile-drawer ${isMenuOpen ? 'active' : ''}`}>
                <div className="drawer-header">
                    <span className="drawer-title">Menú</span>
                    <button className="drawer-close" onClick={closeMenu} aria-label="Cerrar">
                        <X size={24} strokeWidth={1.5} />
                    </button>
                </div>

                <nav className="drawer-nav">
                    <Link to="/" className="drawer-link" onClick={closeMenu}>
                        Inicio <ChevronRight size={18} strokeWidth={1.5} />
                    </Link>
                    <Link to="/productos" className="drawer-link" onClick={closeMenu}>
                        Catálogo de Telas <ChevronRight size={18} strokeWidth={1.5} />
                    </Link>

                    <div className="drawer-divider" />

                    {/* MODIFICACIÓN 2: ACORDEÓN MÓVIL */}
                    <div className="drawer-accordion">
                        <button 
                            className="drawer-link drawer-link--az w-100" 
                            onClick={() => setIsMobileAzOpen(!isMobileAzOpen)}
                            style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
                        >
                            <span className="az-inner">
                                <ArrowUpDown size={18} strokeWidth={1.5} /> Ordenar A–Z
                            </span>
                            <ChevronDown 
                                size={18} 
                                strokeWidth={1.5} 
                                style={{ transform: isMobileAzOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} 
                            />
                        </button>
                        
                        <div className={`mobile-dropdown-list ${isMobileAzOpen ? 'open' : ''}`}>
                            {telasAZ.map(tela => (
                                <Link 
                                    key={tela.id} 
                                    to={`/producto/${tela.id}`} 
                                    className="mobile-dropdown-item" 
                                    onClick={closeMenu}
                                >
                                    {tela.nombre}
                                </Link>
                            ))}
                        </div>
                    </div>

                </nav>

                <div className="drawer-footer">
                    <Link to="/cuenta" className="drawer-account" onClick={closeMenu}>
                        <User size={20} strokeWidth={1.5} /> Mi cuenta
                    </Link>
                </div>
            </aside>
        </>
    );
};

export default Navbar;