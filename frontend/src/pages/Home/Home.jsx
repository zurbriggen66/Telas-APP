import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './Home.css';
import Navbar from '../Navbar/Navbar.jsx';
import { useNavigate } from 'react-router-dom';

/* ── Hook: dispara clase "visible" cuando el elemento entra al viewport ── */
function useScrollReveal() {
    const observer = useRef(null);

    const revealRef = useCallback((node) => {
        if (!node) return;
        if (!observer.current) {
            observer.current = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                            observer.current.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.12 }
            );
        }
        observer.current.observe(node);
    }, []);

    return revealRef;
}

const Home = () => {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [banner, setBanner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fadeLoader, setFadeLoader] = useState(false); // Nuevo estado para transición suave
    const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
    
    const [currentSlide, setCurrentSlide] = useState(0);

    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const navigate = useNavigate();
    const revealRef = useScrollReveal();

    // Fetch de datos con temporizador
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resProductos, resCategorias, resBanner] = await Promise.all([
                    axios.get('http://127.0.0.1:8000/api/productos/'),
                    axios.get('http://127.0.0.1:8000/api/categorias/'),
                    axios.get('http://127.0.0.1:8000/api/banner/'),
                ]);
                setProductos(resProductos.data);
                setCategorias(resCategorias.data);
                setBanner(resBanner.data);
            } catch (error) {
                console.error('Error cargando la web:', error);
            }
        };

        const minimumDelay = new Promise(resolve => setTimeout(resolve, 2000));

        Promise.all([fetchData(), minimumDelay]).finally(() => {
            setFadeLoader(true); // Inicia la animación de desvanecimiento
            setTimeout(() => {
                setLoading(false); // Quita el loader del DOM después de 800ms
            }, 800); 
        });
    }, []);

    // Sincronización del carrito
    useEffect(() => {
        const handleStorageChange = () => {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) setCart(JSON.parse(savedCart));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const heroImages = [
        banner?.banner_1,
        banner?.banner_2,
        banner?.banner_3
    ].filter(Boolean);

    useEffect(() => {
        if (heroImages.length > 1) {
            const interval = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % heroImages.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [heroImages.length]);

    const productosFiltrados =
        categoriaFiltro === 'todas'
            ? productos
            : productos.filter((p) => p.categoria === categoriaFiltro);

    return (
        <div className="home-page">
            
            {/* ── PANTALLA DE CARGA ELEGANTE CON TRANSICIÓN ── */}
            {loading && (
                <div className={`fullscreen-loader ${fadeLoader ? 'fade-out' : ''}`}>
                    <div className="loader-content">
                        <h1 className="loader-brand">Moda & Telas</h1>
                        <div className="loader-bar-container">
                            <div className="loader-bar-fill"></div>
                        </div>
                    </div>
                </div>
            )}

            <Navbar cartCount={cart.length} />

            {/* ── HERO BANNER ── */}
            <div className="hero-banner">
                {heroImages.map((imgUrl, index) => (
                    <div
                        key={index}
                        className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                        style={{ backgroundImage: `url(${imgUrl})` }}
                    />
                ))}

                <div className="hero-overlay">
                    {/* Renderiza el logo si existe, si no un texto por defecto */}
                    {banner?.logo ? (
                        <img src={banner.logo} alt="Logo de la tienda" className="hero-logo" />
                    ) : (
                        <h1 className="fuente-cursiva">{banner?.title || 'Mi Tienda Oficial'}</h1>
                    )}
                    
                    <button className="hero-cta" onClick={() => document.querySelector('.category-section')?.scrollIntoView({ behavior: 'smooth' })}>
                        Ver catálogo
                    </button>
                </div>
            </div>

            <div className="home-container">

                {/* ── CATEGORÍAS ── */}
                <section className="category-section reveal-section" ref={revealRef}>
                    <div className="section-header">
                        <h2 className="section-title">Nuestras Telas</h2>
                        <div className="section-line" />
                    </div>

                    <div className="category-explorer">
                        {loading
                            ? [1, 2, 3, 4].map((n) => (
                                  <div key={n} className="category-card-item">
                                      <div className="category-rect skeleton-rect" />
                                      <div className="skeleton-text-small" />
                                  </div>
                              ))
                            : categorias.map((cat) => (
                                  <div
                                      key={cat.id}
                                      className={`category-card-item ${categoriaFiltro === cat.id ? 'active' : ''}`}
                                      onClick={() => setCategoriaFiltro(cat.id)}
                                  >
                                      <div
                                          className="category-rect"
                                          style={{
                                              backgroundImage: `url(${cat.imagen || 'https://via.placeholder.com/150'})`,
                                          }}
                                      />
                                      <span className="category-name">{cat.nombre}</span>
                                  </div>
                              ))}
                    </div>
                </section>

                {/* ── SECCIÓN PROMOCIONAL ── */}
                <section className="promo-section reveal-section" ref={revealRef}>
                    <div className="promo-content">
                        <span className="promo-eyebrow">Destacado</span>
                        <h2>Nuevos Arrivals de Temporada</h2>
                        <p>Descubrí nuestra última selección de telas importadas. Lino, seda, algodón pima y más — todo con la calidad que nos distingue.</p>
                        <button className="promo-btn" onClick={() => setCategoriaFiltro('todas')}>
                            Explorar ahora
                        </button>
                    </div>
                    <div
                        className="promo-image"
                        style={{
                            backgroundImage: `url(${
                                banner?.imagen_secundaria_1 ||
                                'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1974'
                            })`,
                        }}
                    />
                </section>

                {/* ── GRILLA DE PRODUCTOS ── */}
                <section className="products-section reveal-section" ref={revealRef}>
                    <div className="section-header">
                        <h2 className="section-title">
                            {categoriaFiltro === 'todas'
                                ? 'Catálogo Completo'
                                : categorias.find((c) => c.id === categoriaFiltro)?.nombre || 'Productos'}
                        </h2>
                        <div className="section-line" />
                    </div>

                    <main className="products-grid">
                        {loading ? (
                            [1, 2, 3, 4, 5, 6].map((n) => (
                                <div key={n} className="product-card skeleton-card">
                                    <div className="skeleton-img" />
                                    <div className="skeleton-info">
                                        <div className="skeleton-tag" />
                                        <div className="skeleton-title" />
                                        <div className="skeleton-price" />
                                    </div>
                                </div>
                            ))
                        ) : productosFiltrados.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">🧵</span>
                                <p>No hay telas publicadas en esta categoría.</p>
                            </div>
                        ) : (
                            productosFiltrados.map((prod, i) => (
                                <div
                                    key={prod.id}
                                    className="product-card reveal-card"
                                    ref={revealRef}
                                    style={{ '--delay': `${(i % 3) * 0.1}s` }}
                                    onClick={() => navigate(`/producto/${prod.id}`)}
                                >
                                    <div className="product-image-container">
                                        <img
                                            src={prod.imagen || 'https://via.placeholder.com/400'}
                                            alt={prod.nombre}
                                            className="product-image"
                                            loading="lazy"
                                        />
                                        <div className="product-badge">Ver detalle</div>
                                    </div>
                                    <div className="product-info">
                                        <span className="product-tag">
                                            {prod.categoria_nombre || 'Nueva'}
                                        </span>
                                        <h3 className="product-title">{prod.nombre}</h3>
                                        <div className="product-footer">
                                            <span className="product-price">
                                                ${Number(prod.precio_por_metro).toLocaleString('es-AR')}
                                                <span> /m</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </main>
                </section>
            </div>
        </div>
    );
};

export default Home;