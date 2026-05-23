import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Ruler, Layers, AlertTriangle, CheckCircle, X } from 'lucide-react';
import Navbar from '../Navbar/Navbar';
import './Detalle_producto.css';

const DetalleProducto = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [producto, setProducto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imagenActiva, setImagenActiva] = useState(null); 

    // NUEVOS ESTADOS: Control de Metros y Carrito
    const [metros, setMetros] = useState(1);
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // NUEVO ESTADO: Notificación delicada
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    // FUNCIÓN PARA MOSTRAR Y OCULTAR AUTOMÁTICAMENTE
    const showDelicateNotification = (message, type = 'error') => {
        if (window.notifTimeout) clearTimeout(window.notifTimeout);
        setNotification({ show: true, message, type });
        window.notifTimeout = setTimeout(() => {
            setNotification({ show: false, message: '', type: '' });
        }, 4000);
    };

    // Cargar los datos del producto
    useEffect(() => {
        const fetchProducto = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/productos/${id}/`);
                if (!response.ok) {
                    throw new Error('No se pudo cargar el producto');
                }
                const data = await response.json();
                setProducto(data);
                setImagenActiva(data.imagen); 
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchProducto();
    }, [id]);

    // Guardar el carrito en LocalStorage cada vez que se actualiza
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    // Lógica para agregar al carrito
    const agregarAlCarrito = () => {
        const metrosEnteros = parseInt(metros);
        
        // Validación 1: Debe ser un número válido mayor a 0
        if (isNaN(metrosEnteros) || metrosEnteros <= 0) {
            showDelicateNotification("Por favor, ingresá una cantidad válida de metros.", "error");
            return;
        }

        // 👇 NUEVA LÓGICA DE STOCK 👇
        // 1. Nos fijamos si esta tela ya está en el carrito y cuántos metros tiene
        const itemEnCarrito = cart.find(item => item.id === producto.id);
        const cantidadYaEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
        
        // 2. Sumamos lo que quiere agregar AHORA + lo que YA TIENE guardado
        const cantidadTotalDeseada = metrosEnteros + cantidadYaEnCarrito;

        // Validación 2: No superar el stock disponible (contando la bolsa)
        if (cantidadTotalDeseada > Number(producto.stock_metros)) {
            if (cantidadYaEnCarrito > 0) {
                const metrosRestantes = Number(producto.stock_metros) - cantidadYaEnCarrito;
                
                // 👇 Atajamos el caso de que ya tenga todo el stock en la bolsa 👇
                if (metrosRestantes === 0) {
                    showDelicateNotification(`Ya agregaste todo nuestro stock disponible (${cantidadYaEnCarrito}m) a tu bolsa.`, "error");
                } else {
                    // Si todavía le queda un poquito por agregar:
                    showDelicateNotification(`Ya tenés ${cantidadYaEnCarrito}m en tu bolsa. Solo podés sumar ${metrosRestantes}m más.`, "error");
                }
            } else {
                // Si no tenía nada en el carrito, el mensaje normal
                showDelicateNotification(`Lo sentimos, solo nos quedan ${producto.stock_metros} metros en stock de esta tela.`, "error");
            }
            return;
        }
        // 👆 FIN DE NUEVA LÓGICA 👆

        setCart(prev => {
            const existe = prev.find(item => item.id === producto.id);
            if (existe) {
                return prev.map(item => 
                    item.id === producto.id ? {...item, cantidad: item.cantidad + metrosEnteros} : item
                );
            }
            return [...prev, {...producto, cantidad: metrosEnteros}];
        });
        
        showDelicateNotification(`¡Listo! Se agregaron ${metrosEnteros} metro(s) de ${producto.nombre} a tu carrito.`, "success");
    };

    // Calculamos si ya tiene esta tela en el carrito para mostrar el aviso
    const itemEnCarrito = cart.find(item => item.id === producto?.id);
    const cantidadYaEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;

    if (loading) {
        return (
            <>
                <Navbar cartCount={cart.length} />
                <div className="loader-container"><div className="loader"></div></div>
            </>
        );
    }

    if (error || !producto) {
        return (
            <>
                {/* CORRECCIÓN: Estaba el reduce viejo acá */}
                <Navbar cartCount={cart.length} />
                <div className="error-message">{error ? `Error: ${error}` : 'Producto no encontrado.'}</div>
            </>
        );
    }

    const todasLasImagenes = [
        producto.imagen, 
        ...(producto.imagenes_galeria?.map(img => img.imagen) || [])
    ].filter(Boolean); 

    return (
        <>
            {/* CORRECCIÓN: Estaba el reduce viejo acá también */}
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
                            
                            <div className="detalle-talle" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Ruler size={18} />
                                    <span>Ancho de fábrica: <strong>{producto.ancho_cm} cm</strong></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: Number(producto.stock_metros) <= 2 ? '#ef4444' : '#10b981' }}>
                                    <Layers size={18} />
                                    <span>Stock disponible: <strong>{producto.stock_metros} metros</strong></span>
                                </div>
                            </div>
                            
                            <div className="detalle-descripcion">
                                <h3>Descripción</h3>
                                <p>{producto.descripcion}</p>
                            </div>

                            <div style={{ marginTop: '10px', padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                {/* NOTIFICACIÓN DELICADA */}
                            
                                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '700', fontSize: '0.85rem', color: '#475569', letterSpacing: '0.5px' }}>
                                    ¿CUÁNTOS METROS NECESITÁS? (ENTEROS)
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max={Math.floor(Number(producto.stock_metros))} 
                                        step="1"
                                        value={metros}
                                        onChange={(e) => setMetros(e.target.value)}
                                        style={{ 
                                            width: '80px', padding: '12px', border: '2px solid #cbd5e1', 
                                            borderRadius: '6px', fontSize: '1.2rem', textAlign: 'center', 
                                            fontWeight: 'bold', outline: 'none'
                                        }}
                                    />
                                    <span style={{ fontWeight: '600', color: '#64748b' }}>metros totales</span>
                                </div>
                                <p style={{ marginTop: '16px', fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' }}>
                                    Total a pagar: ${(producto.precio_por_metro * (parseInt(metros) || 0)).toLocaleString('es-AR')}
                                </p>
                            </div>

                            <button className="btn-agregar-carrito" onClick={agregarAlCarrito} style={{ marginTop: '10px' }}>
                                <ShoppingBag size={20} />
                                Agregar al carrito
                            </button>
                        </div>
                    </div>
                </div>
            </div> {/* Cierre de detalle-page */}

            {/* 👇 NUEVA ALERTA FLOTANTE ESTILO MERCADO LIBRE 👇 */}
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