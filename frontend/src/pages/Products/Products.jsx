import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, Loader2, SlidersHorizontal } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom'; 
import Navbar from '../Navbar/Navbar';
import './Products.css';

const Productos = () => {
    const [productos, setProductos] = useState([]);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    
    // Estados para los filtros
    const [categorias, setCategorias] = useState([]);
    const [filtroCategoria, setFiltroCategoria] = useState('Todas');
    const [ordenPrecio, setOrdenPrecio] = useState('defecto');

    const [cart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // 1. Traer los productos
    useEffect(() => {
        const fetchProductos = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/productos/');
                const data = response.data;
                setProductos(data);
                setProductosFiltrados(data);
                
                // --- EXTRACCIÓN DINÁMICA DE CATEGORÍAS ---
                const catsExtraidas = data.map(item => {
                    // Si Django te manda un objeto: { id: 1, nombre: "Sedas" }
                    if (typeof item.categoria === 'object' && item.categoria !== null) {
                        return item.categoria.nombre; // Cambiá '.nombre' si tu modelo usa otro campo (ej: '.name')
                    }
                    // Si Django te manda directamente el texto o el ID: "Sedas" o 1
                    return item.categoria; 
                });

                // Limpiamos duplicados y valores nulos/vacíos usando un Set
                const catsUnicas = [...new Set(catsExtraidas)].filter(Boolean);
                
                setCategorias(catsUnicas);
                setLoading(false);
            } catch (err) {
                console.error("Error al cargar productos:", err);
                setError("No pudimos cargar el catálogo en este momento.");
                setLoading(false);
            }
        };
        fetchProductos();
    }, []);

    // 2. Aplicar Filtros y Ordenamiento dinámicamente
    // Aplicar Filtros y Ordenamiento dinámicamente
    // Aplicar Filtros y Ordenamiento dinámicamente
    useEffect(() => {
        // Hacemos una copia de los productos originales para no modificarlos
        let resultado = [...productos];

        // 1. Filtro por Categoría
        if (filtroCategoria !== 'Todas') {
            // Le agregamos String() a los dos para que "6" sea igual a "6"
            resultado = resultado.filter(p => String(p.categoria) === String(filtroCategoria));
        }

        // 2. Ordenamiento por Precio
        if (ordenPrecio === 'menor') {
            resultado.sort((a, b) => parseFloat(a.precio_por_metro) - parseFloat(b.precio_por_metro));
        } else if (ordenPrecio === 'mayor') {
            resultado.sort((a, b) => parseFloat(b.precio_por_metro) - parseFloat(a.precio_por_metro));
        }

        // Actualizamos el estado que dibuja las tarjetas en pantalla
        setProductosFiltrados(resultado);
        
    }, [filtroCategoria, ordenPrecio, productos]);

    const irAlDetalle = (idProducto) => {
        navigate(`/producto/${idProducto}`);
    };

    if (loading) {
        return (
            <>
                <Navbar cartCount={cart.length} />
                <div className="productos-loading">
                    <Loader2 className="spinner" size={40} />
                    <p>Preparando catálogo...</p>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar cartCount={cart.length} />
                <div className="productos-error"><p>{error}</p></div>
            </>
        );
    }

    return (
        <>
            <Navbar cartCount={cart.length} />

            <div className="catalogo-page">
                <header className="catalogo-header">
                    <h1 className="catalogo-title">Catálogo Completo</h1>
                    <p className="catalogo-subtitle">Explorá nuestra selección de telas de primera calidad.</p>
                    <div className="catalogo-divider"></div>
                </header>

                {/* BARRA DE FILTROS */}
                <section className="filtros-container">
                    <div className="filtros-header">
                        <SlidersHorizontal size={20} className="filtros-icon" />
                        <span>Filtrar y Ordenar</span>
                    </div>
                    
                    <div className="filtros-controles">
                        <div className="filtro-grupo">
                            <label>Categoría</label>
                            <select 
                                value={filtroCategoria} 
                                onChange={(e) => setFiltroCategoria(e.target.value)}
                                className="filtro-select"
                            >
                                <option value="Todas">Todas las telas</option>
                                {categorias.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filtro-grupo">
                            <label>Precio</label>
                            <select 
                                value={ordenPrecio} 
                                onChange={(e) => setOrdenPrecio(e.target.value)}
                                className="filtro-select"
                            >
                                <option value="defecto">Relevancia</option>
                                <option value="menor">Menor a Mayor precio</option>
                                <option value="mayor">Mayor a Menor precio</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* GRILLA DE PRODUCTOS */}
                <main className="catalogo-grid">
                    {productosFiltrados.length === 0 ? (
                        <div className="sin-resultados">
                            <p>No encontramos telas con estos filtros.</p>
                            <button onClick={() => { setFiltroCategoria('Todas'); setOrdenPrecio('defecto'); }} className="btn-limpiar">
                                Limpiar filtros
                            </button>
                        </div>
                    ) : (
                        productosFiltrados.map((producto) => (
                            <article 
                                key={producto.id} 
                                className="producto-card"
                                onClick={() => irAlDetalle(producto.id)}
                            >
                                <div className="producto-image-container">
                                    <img 
                                        src={producto.imagen || '/placeholder-tela.jpg'} 
                                        alt={producto.nombre} 
                                        className="producto-image" 
                                    />
                                    {producto.stock_metros < 10 && producto.stock_metros > 0 && (
                                        <span className="producto-badge">Últimos metros</span>
                                    )}
                                </div>
                                
                                <div className="producto-info">
                                    <h2 className="producto-nombre">{producto.nombre}</h2>
                                    <p className="producto-precio">
                                        ${parseFloat(producto.precio_por_metro).toLocaleString('es-AR')} <span>/ metro</span>
                                    </p>
                                    
                                    <button 
                                        className="btn-add-cart" 
                                        disabled={producto.stock_metros <= 0}
                                        onClick={(e) => {
                                            e.stopPropagation(); 
                                            irAlDetalle(producto.id);
                                        }}
                                    >
                                        <Eye size={18} />
                                        {producto.stock_metros > 0 ? 'Ver Detalles' : 'Agotado'}
                                    </button>
                                </div>
                            </article>
                        ))
                    )}
                </main>
            </div>
        </>
    );
};

export default Productos;