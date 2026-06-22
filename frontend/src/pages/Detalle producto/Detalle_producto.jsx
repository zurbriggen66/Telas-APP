import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Ruler, AlertTriangle, CheckCircle, X } from 'lucide-react';
import Navbar from '../Navbar/Navbar';
import './Detalle_producto.css';

const DetalleProducto = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [producto, setProducto] = useState(null);
    const [colores, setColores] = useState([]); // <-- NUEVO ESTADO PARA LOS COLORES
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imagenActiva, setImagenActiva] = useState(null); 

    const [metros, setMetros] = useState(1.0);
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    const showDelicateNotification = (message, type = 'error') => {
        if (window.notifTimeout) clearTimeout(window.notifTimeout);
        setNotification({ show: true, message, type });
        window.notifTimeout = setTimeout(() => {
            setNotification({ show: false, message: '', type: '' });
        }, 4000);
    };

    // ACÁ HACEMOS LA MAGIA DE TRAER PRODUCTO + COLORES
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Traemos el producto
                const resProd = await fetch(`${import.meta.env.VITE_API_URL}/api/productos/${id}/`);
                if (!resProd.ok) throw new Error('No se pudo cargar el producto');
                const dataProd = await resProd.json();
                
                // Traemos los colores de la base de datos
                const resCol = await fetch(`${import.meta.env.VITE_API_URL}/api/colores/`);
                const dataCol = resCol.ok ? await resCol.json() : [];
                const coloresArray = Array.isArray(dataCol) ? dataCol : (dataCol.results || []);

                setProducto(dataProd);
                setColores(coloresArray);
                setImagenActiva(dataProd.imagen); 
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const incrementarMetros = () => {
        setMetros(prev => {
            const nuevo = prev + 0.5;
            return nuevo > Number(producto.stock_metros) ? prev : nuevo;
        });
    };

    const decrementarMetros = () => {
        setMetros(prev => (prev > 0.5 ? prev - 0.5 : 0.5));
    };

    const agregarAlCarrito = () => {
        const metrosFloat = parseFloat(metros);
        
        if (isNaN(metrosFloat) || metrosFloat <= 0) {
            showDelicateNotification("Por favor, ingresá una cantidad válida de metros.", "error");
            return;
        }

        const itemEnCarrito = cart.find(item => item.id === producto.id);
        const cantidadYaEnCarrito = itemEnCarrito ? parseFloat(itemEnCarrito.cantidad) : 0;
        const cantidadTotalDeseada = metrosFloat + cantidadYaEnCarrito;
        const stockDisponible = parseFloat(producto.stock_metros);

        if (cantidadTotalDeseada > stockDisponible) {
            if (cantidadYaEnCarrito > 0) {
                const metrosRestantes = stockDisponible - cantidadYaEnCarrito;
                if (metrosRestantes === 0) {
                    showDelicateNotification(`Ya agregaste todo nuestro stock disponible (${cantidadYaEnCarrito}m) a tu bolsa.`, "error");
                } else {
                    showDelicateNotification(`Ya tenés ${cantidadYaEnCarrito}m en tu bolsa. Solo podés sumar ${metrosRestantes}m más.`, "error");
                }
            } else {
                showDelicateNotification(`Lo sentimos, solo nos quedan ${stockDisponible} metros en stock de esta tela.`, "error");
            }
            return;
        }

        setCart(prev => {
            const existe = prev.find(item => item.id === producto.id);
            if (existe) {
                return prev.map(item => 
                    item.id === producto.id ? {...item, cantidad: parseFloat(item.cantidad) + metrosFloat} : item
                );
            }
            return [...prev, {...producto, cantidad: metrosFloat}];
        });
        
        showDelicateNotification(`¡Listo! Se agregaron ${metrosFloat} metro(s) de ${producto.nombre} a tu carrito.`, "success");
    };

    if (loading) {
        return <><Navbar cartCount={cart.length} /><div className="loader-container"><div className="loader"></div></div></>;
    }

    if (error || !producto) {
        return <><Navbar cartCount={cart.length} /><div className="error-message">{error ? `Error: ${error}` : 'Producto no encontrado.'}</div></>;
    }

    const todasLasImagenes = [
        producto.imagen, 
        ...(producto.imagenes_galeria?.map(img => img.imagen) || [])
    ].filter(Boolean); 

    const precioTotal = (parseFloat(producto.precio_por_metro) * parseFloat(metros)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // 👇 IDENTIFICAMOS EL COLOR CRUZANDO EL ID 👇
    let colorObj = null;
    if (producto.color) {
        colorObj = colores.find(c => c.id === producto.color);
    }

    return (
        <>
            <Navbar cartCount={cart.length} />
            <div className="detalle-page">
                <div className="detalle-container">
                    <button className="back-button" onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} strokeWidth={1.5} /> Volver
                    </button>

                    <div className="detalle-grid">
                        <div className="detalle-galeria-wrapper">
                            <div className="detalle-imagen-container">
                                <img 
                                    src={imagenActiva || 'https://via.placeholder.com/600?text=Sin+Imagen'} 
                                    alt={producto.nombre} 
                                    className="detalle-imagen"
                                />
                            </div>
                            
                            {todasLasImagenes.length > 1 && (
                                <div className="detalle-miniaturas">
                                    {todasLasImagenes.map((img, index) => (
                                        <img 
                                            key={index}
                                            src={img}
                                            alt={`${producto.nombre} vista ${index + 1}`}
                                            className={`miniatura-img ${imagenActiva === img ? 'activa' : ''}`}
                                            onClick={() => setImagenActiva(img)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="detalle-info">
                            <span className="detalle-categoria">
                                {producto.categorias_nombres && producto.categorias_nombres.length > 0 
                                    ? producto.categorias_nombres.join(' • ') 
                                    : 'Sin categoría'}
                            </span>
                            <h1 className="detalle-titulo">{producto.nombre}</h1>
                            
                            <p className="detalle-precio">${parseFloat(producto.precio_por_metro).toLocaleString('es-AR')} <span style={{fontSize: '1rem', color: '#666'}}>/ Metro</span></p>
                            
                            <div className="detalle-talle">
                                <Ruler size={18} />
                                <span>Ancho de fábrica: <strong>{producto.ancho_cm} cm</strong></span>
                            </div>
                            
                            <div className="detalle-descripcion">
                                <h3>Descripción</h3>
                                <p>{producto.descripcion || 'Sin descripción detallada.'}</p>

                                {/* 👇 SECCIÓN DE COLOR ARREGLADA 👇 */}
                                {colorObj && (
                                    <div className="detalle-color-box">
                                        <h4>Color de la tela</h4>
                                        <div className="color-chip">
                                            {colorObj.codigo_hex && (
                                                <span className="color-circle" style={{ backgroundColor: colorObj.codigo_hex }}></span>
                                            )}
                                            {colorObj.nombre || 'Definido en imagen'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="compra-box">
                                <h4 className="compra-box-title">¿CUÁNTOS METROS NECESITÁS?</h4>
                                <div className="cantidad-sofisticada">
                                    <button className="cantidad-btn" onClick={decrementarMetros}>-</button>
                                    <div className="cantidad-valor">
                                        {Number(metros).toFixed(1)} <span className="cantidad-unidad">mts</span>
                                    </div>
                                    <button className="cantidad-btn" onClick={incrementarMetros}>+</button>
                                </div>
                                <div className="precio-total">
                                    Total a pagar: ${precioTotal}
                                </div>
                                <button className="btn-agregar-carrito" onClick={agregarAlCarrito}>
                                    <ShoppingBag size={20} />
                                    Agregar al carrito
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {notification.show && (
                <div className="alerta-flotante">
                    <div className="alerta-contenido">
                        {notification.type === 'success' ? (
                            <CheckCircle size={24} color="#10b981" strokeWidth={1.5} />
                        ) : (
                            <AlertTriangle size={24} color="#ef4444" strokeWidth={1.5} />
                        )}
                        <span className="alerta-texto">{notification.message}</span>
                    </div>
                    <button 
                        className="alerta-cerrar" 
                        onClick={() => setNotification({ show: false, message: '', type: '' })}
                    >
                        <X size={18} color="#3b82f6" strokeWidth={2} />
                    </button>
                </div>
            )}
        </>
    );
};

export default DetalleProducto;