import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Home.css'; 
import Navbar from '../Navbar/Navbar.jsx';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // NUEVO ESTADO: Para que funcione la barra de categorías de arriba
    const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

    /* LÓGICA DEL CARRITO: Lo mantenemos solo para leer la cantidad y pasarla al Navbar */
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const navigate = useNavigate();

    useEffect(() => {
        // Función para traer toda la info del backend
        const fetchData = async () => {
            try {
                // Hacemos ambas peticiones al mismo tiempo
                const [resProductos, resCategorias] = await Promise.all([
                    axios.get('http://127.0.0.1:8000/api/productos/'),
                    axios.get('http://127.0.0.1:8000/api/categorias/')
                ]);

                setProductos(resProductos.data);
                setCategorias(resCategorias.data);
                setLoading(false);
            } catch (error) {
                console.error("Error cargando la web:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Escuchamos los cambios en el LocalStorage por si agregan al carrito desde el detalle
    useEffect(() => {
        const handleStorageChange = () => {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) setCart(JSON.parse(savedCart));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    if (loading) return <div className="loader" style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>Cargando catálogo de telas...</div>;

    // Lógica para filtrar los productos según el botón de categoría que toquen
    const productosFiltrados = categoriaFiltro === 'todas' 
        ? productos 
        : productos.filter(p => p.categoria === categoriaFiltro);

    return (
        <div className="home-page">
            <Navbar cartCount={cart.length} />
            <div className="home-container">
                
                <header className="home-header" style={{ marginTop: '80px' }}>
                    <h1>Explora nuestra Colección</h1>
                    <p>Calidad premium en cada metro de tela</p>
                </header>

                {/* BARRA DE CATEGORÍAS FUNCIONAL */}
                <nav className="categories-bar">
                    <button 
                        className={`category-btn ${categoriaFiltro === 'todas' ? 'active' : ''}`}
                        onClick={() => setCategoriaFiltro('todas')}
                    >
                        Todas
                    </button>
                    {categorias.map(cat => (
                        <button 
                            key={cat.id} 
                            className={`category-btn ${categoriaFiltro === cat.id ? 'active' : ''}`}
                            onClick={() => setCategoriaFiltro(cat.id)}
                        >
                            {cat.nombre}
                        </button>
                    ))}
                </nav>

                <main className="products-grid">
                    {productosFiltrados.length === 0 ? (
                         <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '3rem', color: '#6b7280' }}>
                             No hay telas publicadas en esta categoría por el momento.
                         </div>
                    ) : (
                        productosFiltrados.map(prod => (
                            // La tarjeta entera es clickeable y te lleva al detalle
                            <div key={prod.id} className="product-card" onClick={() => navigate(`/producto/${prod.id}`)} style={{ cursor: 'pointer' }} >
                                <div className="product-image-container">
                                    <img 
                                        src={prod.imagen || 'https://via.placeholder.com/300?text=Sin+Imagen'} 
                                        alt={prod.nombre} 
                                        className="product-image"
                                    />
                                </div>
                                <div className="product-info">
                                    <span className="product-tag">{prod.categoria_nombre || 'Nueva'}</span>
                                    <h3 className="product-title">{prod.nombre}</h3>
                                    
                                    {/* Usamos un truco CSS inline para que la descripción no rompa el alto de la tarjeta si es muy larga */}
                                    <p className="product-description" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {prod.descripcion}
                                    </p>
                                    
                                    <div className="product-footer">
                                        {/* CORRECCIÓN: Usamos precio_por_metro y le agregamos el "/m" para más claridad visual */}
                                        <span className="product-price">
                                            ${Number(prod.precio_por_metro).toLocaleString('es-AR')} <span style={{fontSize: '0.8rem', color: '#6b7280', fontWeight: 500}}>/m</span>
                                        </span>
                                        {/* Eliminamos el div product-actions y el botón Comprar */}
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