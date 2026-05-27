import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Eye, Loader2, SlidersHorizontal, ChevronDown } from 'lucide-react'; 
import { useNavigate, useSearchParams } from 'react-router-dom'; 
import Navbar from '../Navbar/Navbar';
import './Products.css';

// 👇 AQUÍ FALTABA DEFINIR ESTA CONSTANTE
const API = import.meta.env.VITE_API_URL + '/api';

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
    
    // Captura el color de la URL
    const [searchParams] = useSearchParams();
    const colorFiltroURL = searchParams.get('color');

    // NUEVO: Estado para el menú desplegable personalizado
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [cart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const opcionesOrden = [
        { id: 'defecto', label: 'Relevancia' },
        { id: 'menor', label: 'Menor a Mayor precio' },
        { id: 'mayor', label: 'Mayor a Menor precio' }
    ];
    
    const ordenSeleccionado = opcionesOrden.find(opt => opt.id === ordenPrecio)?.label || 'Relevancia';

    // 1. Traer los productos
    useEffect(() => {
        const fetchProductos = async () => {
            setLoading(true);
            try {
                // Construimos la URL dinámica
                let url = `${API}/productos/`;
                if (colorFiltroURL) {
                    url += `?color=${colorFiltroURL}`;
                }

                // Llamada única a la API
                const response = await axios.get(url);
                const data = response.data;
                
                setProductos(data);
                setProductosFiltrados(data);
                
                // Extraer categorías únicas
                const catsExtraidas = [];
                data.forEach(item => {
                    if (item.categorias_nombres && Array.isArray(item.categorias_nombres)) {
                        catsExtraidas.push(...item.categorias_nombres);
                    }
                });

                const catsUnicas = [...new Set(catsExtraidas)].filter(Boolean).sort();
                setCategorias(catsUnicas);
                setLoading(false);
            } catch (err) {
                console.error("Error al cargar productos:", err);
                setError("No pudimos cargar el catálogo en este momento.");
                setLoading(false);
            }
        };
        fetchProductos();
    }, [colorFiltroURL]); // <-- Se ejecuta cada vez que cambia el color en la URL

    // Cerrar el dropdown al hacer clic afuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    // 2. Aplicar Filtros y Ordenamiento (Clienteside)
    useEffect(() => {
        let resultado = [...productos];

        if (filtroCategoria !== 'Todas') {
            resultado = resultado.filter(p => 
                p.categorias_nombres && p.categorias_nombres.includes(filtroCategoria)
            );
        }

        if (ordenPrecio === 'menor') {
            resultado.sort((a, b) => parseFloat(a.precio_por_metro) - parseFloat(b.precio_por_metro));
        } else if (ordenPrecio === 'mayor') {
            resultado.sort((a, b) => parseFloat(b.precio_por_metro) - parseFloat(a.precio_por_metro));
        }

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
                    <span className="catalogo-breadcrumb">INICIO / CATÁLOGO</span>
                    <h1 className="catalogo-title">
    {filtroCategoria === 'Todas' ? 'Catálogo' : filtroCategoria}
</h1>
                </header>

                <div className="categorias-slider-container">
                    <button 
                        className={`categoria-pill ${filtroCategoria === 'Todas' ? 'active' : ''}`}
                        onClick={() => setFiltroCategoria('Todas')}
                    >
                        Todas
                    </button>
                    {categorias.map((cat, index) => (
                        <button 
                            key={index} 
                            className={`categoria-pill ${filtroCategoria === cat ? 'active' : ''}`}
                            onClick={() => setFiltroCategoria(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <section className="filtros-container">
                    <div className="filtro-grupo right-align">
                        <label className="ordenar-label">
                            <SlidersHorizontal size={16} /> Ordenar por:
                        </label>
                        
                        <div className="custom-dropdown" ref={dropdownRef}>
                            <div 
                                className="custom-dropdown-header" 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <span>{ordenSeleccionado}</span>
                                <ChevronDown size={16} className={`dropdown-icon ${isDropdownOpen ? 'open' : ''}`} />
                            </div>
                            
                            {isDropdownOpen && (
                                <div className="custom-dropdown-list">
                                    {opcionesOrden.map((opt) => (
                                        <div 
                                            key={opt.id}
                                            className={`custom-dropdown-item ${ordenPrecio === opt.id ? 'selected' : ''}`}
                                            onClick={() => {
                                                setOrdenPrecio(opt.id);
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            {opt.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <main className="catalogo-grid">
                    {productosFiltrados.length === 0 ? (
                        <div className="sin-resultados">
                            <p>No encontramos telas en esta categoría.</p>
                            <button onClick={() => { setFiltroCategoria('Todas'); setOrdenPrecio('defecto'); }} className="btn-limpiar">
                                Ver todas las telas
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
                                        src={producto.imagen || 'https://via.placeholder.com/600'} 
                                        alt={producto.nombre} 
                                        className="producto-image" 
                                    />
                                    {producto.stock_metros < 10 && producto.stock_metros > 0 && (
                                        <span className="producto-badge">Últimos metros</span>
                                    )}
                                </div>
                                
                                <div className="producto-info">
                                    <span className="producto-tag-lista">
                                        {producto.categorias_nombres?.join(' • ') || 'Nueva'}
                                    </span>
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