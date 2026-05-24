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
    const [fadeLoader, setFadeLoader] = useState(false);
    
    const [currentSlide, setCurrentSlide] = useState(0);

    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const navigate = useNavigate();
    const revealRef = useScrollReveal();

    // Fetch de datos
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resProductos, resCategorias, resBanner] = await Promise.all([
                    axios.get(import.meta.env.VITE_API_URL + '/api/productos/'),
                    axios.get(import.meta.env.VITE_API_URL + '/api/categorias/'),
                    axios.get(import.meta.env.VITE_API_URL + '/api/banner/')
                    
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
            setFadeLoader(true); 
            setTimeout(() => {
                setLoading(false); 
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

    // --- LÓGICA DEL CARRUSEL AUTOMÁTICO DE FAVORITAS ---
    const productosFavoritos = productos.filter(p => p.es_favorito);
    const sliderFavoritasRef = useRef(null);

    useEffect(() => {
        const slider = sliderFavoritasRef.current;
        let animationId;
        
        // Solo animamos si hay favoritas marcadas
        if (slider && productosFavoritos.length > 0) {
            const scroll = () => {
                if (slider) {
                    slider.scrollLeft += 0.5; // Velocidad del deslizamiento
                    // Bucle infinito: si llega al final, vuelve al inicio sutilmente
                    if (slider.scrollLeft >= (slider.scrollWidth - slider.clientWidth)) {
                        slider.scrollLeft = 0; 
                    }
                }
                animationId = requestAnimationFrame(scroll);
            };
            
            animationId = requestAnimationFrame(scroll);
            
            // Pausar al poner el mouse encima para poder hacer clic cómodamente
            slider.addEventListener('mouseenter', () => cancelAnimationFrame(animationId));
            slider.addEventListener('mouseleave', () => animationId = requestAnimationFrame(scroll));
        }
        return () => cancelAnimationFrame(animationId);
    }, [productosFavoritos.length]);

    return (
        <div className="home-page">
            
            {/* ── PANTALLA DE CARGA ── */}
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
                    {banner?.logo ? (
                        <img src={banner.logo} alt="Logo de la tienda" className="hero-logo" />
                    ) : (
                        <h1 className="fuente-cursiva">{banner?.title || 'Mi Tienda Oficial'}</h1>
                    )}
                    
                    <button className="hero-cta" onClick={() => navigate('/productos')}>
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

    {/* Cambiamos 'category-explorer' por 'category-grid' */}
    <div className="category-grid">
        {/* Cambiamos la condición acá */}
        {categorias.length === 0
            ? [1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="category-card-item">
                      <div className="category-rect skeleton-rect" />
                  </div>
              ))
            : categorias.map((cat) => (
                  <div
                      key={cat.id}
                      className="category-card-item"
                      onClick={() => navigate('/productos')}
                  >
                      <div
                          className="category-rect"
                          style={{
                              backgroundImage: `url(${cat.imagen || 'https://via.placeholder.com/600x300'})`,
                          }}
                      >
                          <span className="category-name">{cat.nombre}</span>
                      </div>
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
                        <button className="promo-btn" onClick={() => navigate('/productos')}>
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

                {/* ── SECCIÓN FAVORITAS ── */}
<section className="favoritas-section reveal-section" ref={revealRef}>
    <div className="section-header">
        <h2 className="section-title">Favoritas</h2>
        <div className="section-line" />
    </div>

    {productosFavoritos.length === 0 ? (
        <div className="empty-state">
            <span className="empty-icon">⭐</span>
            <p>Aún no hay telas destacadas. Se mostrarán aquí cuando las marques como favoritas.</p>
        </div>
    ) : (
        <div className="favoritas-slider" ref={sliderFavoritasRef}>
            {[...productosFavoritos, ...productosFavoritos, ...productosFavoritos, ...productosFavoritos].map((prod, index) => (
                <div 
                    key={`${prod.id}-${index}`} 
                    className="favorita-card"
                    onClick={() => navigate(`/producto/${prod.id}`)}
                >
                    <div className="favorita-img-wrapper">
                        {/* Etiqueta flotante sobre la imagen */}
                        
                        <img 
                            src={prod.imagen || 'https://via.placeholder.com/300x400'} 
                            alt={prod.nombre} 
                            loading="lazy" 
                        />
                    </div>
                    <div className="favorita-info">
                        {/* Etiquetas de especificaciones (Ancho, Peso, etc.) */}
                        <div className="favorita-specs">
                            <span className="spec-badge">Ancho: {prod.ancho || '1.50 m'}</span>
                            {prod.peso && <span className="spec-badge">Peso: {prod.peso}</span>}
                        </div>
                        
                        <h4>{prod.nombre}</h4>
                        <p className="favorita-precio">
    ${Number(prod.precio_por_metro || prod.precio).toLocaleString('es-AR')} <span className="precio-unidad">cada/metro</span>
</p>
                    </div>
                </div>
            ))}
        </div>
    )}
</section>

                {/* ── SECCIÓN REDES SOCIALES (ESTILO LIBRAFEMME) ── */}
                {banner?.instagram && (() => {
                    let instaHandle = banner.instagram.trim().replace(/\/$/, '');
                    if (instaHandle.includes('instagram.com/')) {
                        instaHandle = instaHandle.split('instagram.com/')[1];
                    }
                    const displayHandle = instaHandle.startsWith('@') ? instaHandle : `@${instaHandle}`;
                    
                    const instaLink = banner.instagram.startsWith('http') 
                        ? banner.instagram 
                        : `https://instagram.com/${instaHandle.replace('@', '')}`;

                    return (
                        <section className="redes-section reveal-section" ref={revealRef}>
                            <h3 className="redes-title">SEGUINOS EN REDES SOCIALES</h3>
                            <a 
                                href={instaLink}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn-instagram"
                            >
                                {/* USAMOS EL SVG NATIVO DE INSTAGRAM PARA EVITAR ERRORES DE VITE */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                </svg>
                                <span>{displayHandle.toUpperCase()}</span>
                            </a>
                        </section>
                    );
                })()}

            </div>
        </div>
    );
};

export default Home;