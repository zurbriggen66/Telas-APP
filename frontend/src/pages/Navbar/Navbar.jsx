import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Store, User, X, ChevronRight, ArrowUpDown } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ cartCount = 0 }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [logoUrl, setLogoUrl] = useState(null);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/banner/')
            .then(res => { if (res.data?.logo) setLogoUrl(res.data.logo); })
            .catch(() => {});
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
                        <Link to="/buscar-az" className="nav-link nav-link--az">
                            <ArrowUpDown size={14} strokeWidth={1.5} /> A–Z
                        </Link>
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

                    <Link to="/buscar-az" className="drawer-link drawer-link--az" onClick={closeMenu}>
                        <span className="az-inner">
                            <ArrowUpDown size={18} strokeWidth={1.5} /> Ordenar A–Z
                        </span>
                        <ChevronRight size={18} strokeWidth={1.5} />
                    </Link>
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