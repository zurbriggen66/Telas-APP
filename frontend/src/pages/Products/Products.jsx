import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Eye, Loader2, SlidersHorizontal, ChevronDown } from 'lucide-react'; 
import { useNavigate, useSearchParams } from 'react-router-dom'; 
import Navbar from '../Navbar/Navbar';
import './Products.css';

const API = import.meta.env.VITE_API_URL + '/api';

const Productos = () => {
    const [productos, setProductos] = useState([]);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    
    // Estados para los filtros y botones
    const [categorias, setCategorias] = useState([]);
    const [listaUsos, setListaUsos] = useState([]); // 👈 NUEVO: Guardamos todos los usos posibles
    const [filtroCategoria, setFiltroCategoria] = useState('Todas');
    const [ordenPrecio, setOrdenPrecio] = useState('defecto');
    
    // Captura los parámetros de la URL
    const [searchParams] = useSearchParams();
    const colorFiltroURL = searchParams.get('color');
    const usoFiltroURL = searchParams.get('uso');

    // Estado para el menú desplegable de ordenar
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

    // 1. Traer los productos y usos
    useEffect(() => {
        const fetchDatos = async () => {
            setLoading(true);
            try {
                // Armamos la URL para los productos
                let urlProductos = `${API}/productos/`;
                const params = new URLSearchParams();
                
                if (colorFiltroURL) params.append('color', colorFiltroURL);
                if (usoFiltroURL) params.append('uso', usoFiltroURL);

                if (params.toString()) urlProductos += `?${params.toString()}`;

                // Hacemos las dos peticiones a la API al mismo tiempo para no perder velocidad
                const [resProductos, resUsos] = await Promise.all([
                    axios.get(urlProductos),
                    axios.get(`${API}/usos/`)
                ]);
                
                const dataProductos = resProductos.data;
                const dataUsos = Array.isArray(resUsos.data) ? resUsos.data : resUsos.data.results || [];
                
                setProductos(dataProductos);
                setProductosFiltrados(dataProductos);
                setListaUsos(dataUsos);
                
                // Si cambiamos de URL, reseteamos la categoría a "Todas" para evitar el bug de inmovilidad
                setFiltroCategoria('Todas');
                
                // Extraer categorías únicas para los botones
                const catsExtraidas = [];
                dataProductos.forEach(item => {
                    if (item.categorias_nombres && Array.isArray(item.categorias_nombres)) {
                        catsExtraidas.push(...item.categorias_nombres);
                    }
                });

                const catsUnicas = [...new Set(catsExtraidas)].filter(Boolean).sort();
                setCategorias(catsUnicas);
                
                setLoading(false);
            } catch (err) {
                console.error("Error al cargar datos:", err);
                setError("No pudimos cargar el catálogo en este momento.");
                setLoading(false);
            }
        };
        fetchDatos();
    }, [colorFiltroURL, usoFiltroURL]);

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

    // 2. Aplicar Filtros y Ordenamiento (Clientside)
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

    // --- LÓGICA DEL TÍTULO DINÁMICO ---
    let tituloBanner = 'Catálogo';
    if (usoFiltroURL && listaUsos.length > 0) {
        const usoActual = listaUsos.find(u => u.id.toString() === usoFiltroURL);
        tituloBanner = usoActual ? usoActual.nombre : 'Telas para...';
    } else if (colorFiltroURL) {
        tituloBanner = 'Filtrado por Color';
    } else if (filtroCategoria !== 'Todas') {
        tituloBanner = filtroCategoria;
    }

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
                    <h1 className="catalogo-title">{tituloBanner}</h1>
                </header>

                <div className="categorias-slider-container">
                    {/* 👇 MAGIA DEL SLIDER DINÁMICO 👇 */}
                    {usoFiltroURL ? (
                        // MODO 1: Si entramos desde "Telas para...", los botones muestran todos los Usos posibles
                        <>
                            <button 
                                className="categoria-pill"
                                onClick={() => navigate('/productos')}
                            >
                                Ver Todo
                            </button>
                            {listaUsos.map((uso) => (
                                <button 
                                    key={uso.id} 
                                    className={`categoria-pill ${usoFiltroURL === uso.id.toString() ? 'active' : ''}`}
                                    onClick={() => navigate(`/productos?uso=${uso.id}`)}
                                >
                                    {uso.nombre}
                                </button>
                            ))}
                        </>
                    ) : (
                        // MODO 2: Si estamos en el catálogo normal, los botones muestran las Categorías (Lino, Gasa, etc.)
                        <>
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
                        </>
                    )}
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
                            <button onClick={() => navigate('/productos')} className="btn-limpiar">
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