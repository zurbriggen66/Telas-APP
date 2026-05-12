import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Home.css'; 
import Navbar from '../Navbar/Navbar.jsx';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [banner, setBanner] = useState(null); // Nuevo estado para el Banner
    const [loading, setLoading] = useState(true);
    const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Traemos Productos, Categorías y el Banner al mismo tiempo
                const [resProductos, resCategorias, resBanner] = await Promise.all([
                    axios.get('http://127.0.0.1:8000/api/productos/'),
                    axios.get('http://127.0.0.1:8000/api/categorias/'),
                    axios.get('http://127.0.0.1:8000/api/banner/')
                ]);

                setProductos(resProductos.data);
                setCategorias(resCategorias.data);
                setBanner(resBanner.data);
                setLoading(false);
            } catch (error) {
                console.error("Error cargando la web:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const handleStorageChange = () => {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) setCart(JSON.parse(savedCart));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const productosFiltrados = categoriaFiltro === 'todas' 
        ? productos 
        : productos.filter(p => p.categoria === categoriaFiltro);

    return (
        <div className="home-page">
            <Navbar cartCount={cart.length} />
            
            {/* =========================================
                BLOQUE 1: HERO BANNER
            ========================================= */}
            <div className="hero-banner" style={{ 
                backgroundImage: `url(${banner?.main_image || 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=2070'})` 
            }}>
                <div className="hero-overlay">
                    <h1 className="fuente-cursiva">{banner?.title || 'Boutique de Telas'}</h1>
                    <p>Calidad premium en cada metro</p>
                </div>
            </div>

            <div className="home-container">
                {/* =========================================
                    BLOQUE 2: EXPLORADOR DE CATEGORÍAS
                ========================================= */}
                <section className="category-section">
                    <h2 className="section-title">Nuestras Telas</h2>
                    <div className="category-explorer">
                        
                        {/* Botón "Todas" */}
                        <div className={`category-item ${categoriaFiltro === 'todas' ? 'active' : ''}`} onClick={() => setCategoriaFiltro('todas')}>
                            <div className="category-circle todas-circle">
                                <span>Todas</span>
                            </div>
                            <span className="category-name">Ver Catálogo</span>
                        </div>

                        {loading ? (
                            /* SKELETONS PARA CATEGORÍAS */
                            [1, 2, 3, 4].map(n => (
                                <div key={n} className="category-item">
                                    <div className="category-circle skeleton-circle"></div>
                                    <div className="skeleton-text-small"></div>
                                </div>
                            ))
                        ) : (
                            /* CATEGORÍAS REALES */
                            categorias.map(cat => (
                                <div key={cat.id} className={`category-item ${categoriaFiltro === cat.id ? 'active' : ''}`} onClick={() => setCategoriaFiltro(cat.id)}>
                                    <div className="category-circle" style={{ backgroundImage: `url(${cat.imagen || 'https://via.placeholder.com/150'})` }}></div>
                                    <span className="category-name">{cat.nombre}</span>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* =========================================
                    BLOQUE 3: CATÁLOGO DE PRODUCTOS
                ========================================= */}
                <main className="products-grid">
                    {loading ? (
                        /* SKELETONS PARA PRODUCTOS */
                        [1, 2, 3, 4, 5, 6].map(n => (
                            <div key={n} className="product-card skeleton-card">
                                <div className="skeleton-img"></div>
                                <div className="skeleton-info">
                                    <div className="skeleton-tag"></div>
                                    <div className="skeleton-title"></div>
                                    <div className="skeleton-price"></div>
                                </div>
                            </div>
                        ))
                    ) : productosFiltrados.length === 0 ? (
                        <div className="empty-state">No hay telas publicadas en esta categoría.</div>
                    ) : (
                        /* PRODUCTOS REALES */
                        productosFiltrados.map(prod => (
                            <div key={prod.id} className="product-card" onClick={() => navigate(`/producto/${prod.id}`)}>
                                <div className="product-image-container">
                                    <img src={prod.imagen || 'https://via.placeholder.com/400'} alt={prod.nombre} className="product-image" />
                                </div>
                                <div className="product-info">
                                    <span className="product-tag">{prod.categoria_nombre || 'Nueva'}</span>
                                    <h3 className="product-title">{prod.nombre}</h3>
                                    
                                    <div className="product-footer">
                                        <span className="product-price">
                                            ${Number(prod.precio_por_metro).toLocaleString('es-AR')} <span>/m</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </main>
            </div>
        </div>
    );
};

export default Home;