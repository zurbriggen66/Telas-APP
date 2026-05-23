import React, { useState, useEffect } from 'react';
import { Trash2, ShoppingBag, Truck } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../Navbar/Navbar.jsx';
import './Carrito.css';

const Carrito = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // --- NUEVOS ESTADOS PARA LOGÍSTICA ---
    const [codigoPostal, setCodigoPostal] = useState('');
    const [costoEnvio, setCostoEnvio] = useState(0);
    const [infoEnvio, setInfoEnvio] = useState(null);
    const [errorEnvio, setErrorEnvio] = useState('');
    const [isLoadingEnvio, setIsLoadingEnvio] = useState(false);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const subtotal = cart.reduce((acc, item) => acc + (Number(item.precio_por_metro) * item.cantidad), 0);
    const total = subtotal + costoEnvio;

    const eliminarItem = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };
    
    // --- FUNCIÓN: Conectar con el backend de Django ---
    const handleCalcularEnvio = async () => {
        if (!codigoPostal || codigoPostal.trim() === '') {
            setErrorEnvio('Ingresa tu Código Postal');
            return;
        }

        setIsLoadingEnvio(true);
        setErrorEnvio('');
        setInfoEnvio(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cotizar-envio/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ codigo_postal: codigoPostal })
            });

            const data = await response.json();

            if (data.error) {
                setErrorEnvio(data.mensaje || 'Error al calcular el envío');
                setCostoEnvio(0);
            } else {
                setCostoEnvio(data.costo);
                setInfoEnvio({
                    proveedor: data.proveedor,
                    tiempo: data.tiempo_entrega,
                    tipo: data.tipo
                });
            }
        } catch (error) {
            setErrorEnvio('Error de conexión con el servidor.');
            setCostoEnvio(0);
        } finally {
            setIsLoadingEnvio(false);
        }
    };

    // Enviar los datos de envío a la pantalla de Checkout
    const handleIrAlCheckout = () => {
        navigate('/checkout', { 
            state: { 
                subtotal: subtotal,
                costoEnvio: costoEnvio,
                total: total,
                codigoPostal: codigoPostal,
                tipoEnvio: infoEnvio ? infoEnvio.tipo : null
            } 
        }); 
    };

    return (
        <div className="cart-page">
            <Navbar cartCount={cart.length} />
            
            <div className="cart-container">
                <header className="cart-header">
                    <h1>Mi Bolsa de Compras</h1>
                    <p>{cart.length === 0 ? 'Aún no hay telas en tu bolsa' : `Tienes ${cart.length} corte(s) de tela listos para crear`}</p>
                </header>

                {cart.length === 0 ? (
                    <div className="cart-empty">
                        <ShoppingBag size={60} strokeWidth={1} color="#C4A484" />
                        <p>Tu bolsa de compras está vacía.</p>
                        <Link to="/" className="btn-back">Descubrir Telas</Link>
                    </div>
                ) : (
                    <div className="cart-layout">
                        <div className="cart-items-list">
                            {cart.map(item => (
                                <div key={item.id} className="cart-item-card">
                                    <div className="cart-item-img-wrapper">
                                        <img src={item.imagen} alt={item.nombre} className="cart-item-img" />
                                    </div>
                                    <div className="cart-item-details">
                                        <div className="cart-item-info">
                                            <h3>{item.nombre}</h3>
                                            <p className="item-meta">Ancho de fábrica: <span>{item.ancho_cm} cm</span></p>
                                            <p className="item-meta">Corte solicitado: <span>{item.cantidad} metros</span></p>
                                        </div>
                                        <div className="cart-item-actions">
                                            <p className="item-subtotal">${(Number(item.precio_por_metro) * item.cantidad).toLocaleString('es-AR')}</p>
                                            <button className="btn-remove" onClick={() => eliminarItem(item.id)}>
                                                <Trash2 size={16} strokeWidth={1.5} /> Quitar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <aside className="cart-summary-card">
                            <h2>Resumen del Pedido</h2>
                            
                            {/* --- SECCIÓN DE CÁLCULO DE ENVÍO --- */}
                            <div className="shipping-calculator">
                                <label className="shipping-label"><Truck size={18} /> Calcular Envío</label>
                                <div className="shipping-input-group">
                                    <input 
                                        type="text" 
                                        placeholder="Código Postal (ej: 5000)" 
                                        className="shipping-input"
                                        value={codigoPostal}
                                        onChange={(e) => setCodigoPostal(e.target.value)}
                                        maxLength={8}
                                    />
                                    <button 
                                        className="btn-calc-shipping" 
                                        onClick={handleCalcularEnvio}
                                        disabled={isLoadingEnvio || cart.length === 0}
                                    >
                                        {isLoadingEnvio ? 'Calculando...' : 'Cotizar'}
                                    </button>
                                </div>
                                {errorEnvio && <p className="shipping-error">{errorEnvio}</p>}
                                {infoEnvio && (
                                    <p className="shipping-success">
                                        Se enviará por <strong>{infoEnvio.proveedor}</strong>. 
                                        {infoEnvio.tiempo && infoEnvio.tiempo !== 'Desconocido' && ` Llega en ${infoEnvio.tiempo}.`}
                                    </p>
                                )}
                            </div>
                            {/* ---------------------------------- */}

                            <div className="summary-details">
                                <div className="summary-line">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="summary-line">
                                    <span>Envío</span>
                                    <span className={costoEnvio === 0 ? "free-shipping" : ""}>
                                        {costoEnvio > 0 ? `$${costoEnvio.toLocaleString('es-AR')}` : 'A calcular'}
                                    </span>
                                </div>
                                <div className="summary-line total">
                                    <span>Total Estimado</span>
                                    <span>${total.toLocaleString('es-AR')}</span>
                                </div>
                            </div>

                            <button 
                                className="btn-checkout" 
                                onClick={handleIrAlCheckout} 
                                disabled={cart.length === 0}
                            >
                                Ir al Checkout
                            </button>
                            <p className="secure-checkout">Pago seguro y protegido</p>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Carrito;