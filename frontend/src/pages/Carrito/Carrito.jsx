import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom'; 
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react'; 
import Navbar from '../Navbar/Navbar.jsx';
import './Carrito.css';

// IMPORTANTE: Si tu Access Token en Django empieza con TEST-, 
// tu Public Key aquí TAMBIÉN debe empezar con TEST-.
initMercadoPago('APP_USR-1c7ff523-0d79-493c-88a7-e584d06465ab'); 

const Carrito = () => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const [preferenceId, setPreferenceId] = useState(null);
    const [loading, setLoading] = useState(false); // Definido como 'loading'

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
        setPreferenceId(null); 
    }, [cart]);

    const total = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

    const modificarCantidad = (id, accion) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const nuevaCant = accion === 'suma' ? item.cantidad + 1 : item.cantidad - 1;
                return { ...item, cantidad: Math.max(1, nuevaCant) };
            }
            return item;
        }));
    };

    const eliminarItem = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

  const handleCheckout = async () => {
    setLoading(true);
    try {
        const response = await fetch('http://localhost:8000/api/mercadopago/preference/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: cart }),
        });

        const data = await response.json();
        
        if (data.id) {
            // REDIRECCIÓN DIRECTA
            // Esto lleva al usuario a la pantalla de pago sin mostrar el botón azul
            window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${data.id}`;
        } else {
            console.error("Error en la respuesta del servidor:", data);
            alert("Error al generar el pago.");
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert("No se pudo conectar con el servidor.");
    } finally {
        // No hace falta poner setLoading(false) aquí porque 
        // la página se está redirigiendo, pero por seguridad lo dejamos
        setLoading(false);
    }
};

    return (
        <div className="cart-page">
            {/* Agregamos una validación simple por si el carrito está vacío al reducir */}
            <Navbar cartCount={cart.length > 0 ? cart.reduce((a, b) => a + b.cantidad, 0) : 0} />
            
            <div className="cart-container">
                <header className="cart-header">
                    <h1>Tu Carrito</h1>
                    <p>{cart.length === 0 ? 'Está vacío' : `${cart.length} artículos listos`}</p>
                </header>

                {cart.length === 0 ? (
                    <div className="cart-empty">
                        <ShoppingBag size={80} strokeWidth={1.5} />
                        <p>Parece que aún no has elegido nada.</p>
                        <Link to="/" className="btn-back">Explorar Telas</Link>
                    </div>
                ) : (
                    <div className="cart-layout">
                        <div className="cart-items-list">
                            {cart.map(item => (
                                <div key={item.id} className="cart-item-card">
                                    <img src={item.imagen} alt={item.nombre} className="cart-item-img" />
                                    <div className="cart-item-details">
                                        <div className="cart-item-info">
                                            <h3>{item.nombre}</h3>
                                            <p className="item-meta">Talle: <span>{item.talle}</span></p>
                                        </div>
                                        <div className="cart-item-actions">
                                            <div className="quantity-controls">
                                                <button onClick={() => modificarCantidad(item.id, 'resta')}><Minus size={14}/></button>
                                                <span>{item.cantidad}</span>
                                                <button onClick={() => modificarCantidad(item.id, 'suma')}><Plus size={14}/></button>
                                            </div>
                                            <p className="item-subtotal">${(item.precio * item.cantidad).toLocaleString()}</p>
                                            <button className="btn-remove" onClick={() => eliminarItem(item.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <aside className="cart-summary-card">
                            <h2>Resumen de compra</h2>
                            <div className="summary-details">
                                <div className="summary-line">
                                    <span>Subtotal</span>
                                    <span>${total.toLocaleString()}</span>
                                </div>
                                <div className="summary-line">
                                    <span>Envío</span>
                                    <span className="free-shipping">¡Gratis!</span>
                                </div>
                                <hr />
                                <div className="summary-line total">
                                    <span>Total</span>
                                    <span>${total.toLocaleString()}</span>
                                </div>
                            </div>

                            <button 
                                className="btn-checkout" 
                                onClick={handleCheckout} 
                                disabled={loading || cart.length === 0}
                            >
                                {loading ? (
                                    "Procesando pago..." 
                                ) : (
                                    "Finalizar Pedido"
                                )}
                            </button>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Carrito;