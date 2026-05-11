import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom'; 
import Navbar from '../Navbar/Navbar.jsx';
import './Carrito.css';

const Carrito = () => {
    // Inicialización segura del estado
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Sincronización con localStorage
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
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

    return (
        <div className="cart-page">
            {/* Calculamos el conteo total para la Navbar */}
            <Navbar cartCount={cart.reduce((a, b) => a + b.cantidad, 0)} />
            
            <div className="cart-container">
                <header className="cart-header">
                    <h1>Tu Carrito</h1>
                    <p>{cart.length === 0 ? 'Está vacío' : `${cart.length} artículos listos para enviar`}</p>
                </header>

                {/* Lógica de Renderizado Condicional */}
                {cart.length === 0 ? (
                    // Cambia esta parte en tu Carrito.jsx
                    <div className="cart-empty">
                        <ShoppingBag size={80} strokeWidth={1.5} />
                        <p>Parece que aún no has elegido nada.</p>
                        <Link to="/" className="btn-back">Explorar Telas</Link>
                    </div>
                ) : (
                    <div className="cart-layout">
                        {/* Columna de Productos */}
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
                                                <button onClick={() => modificarCantidad(item.id, 'resta')}>
                                                    <Minus size={14}/>
                                                </button>
                                                <span>{item.cantidad}</span>
                                                <button onClick={() => modificarCantidad(item.id, 'suma')}>
                                                    <Plus size={14}/>
                                                </button>
                                            </div>
                                            <p className="item-subtotal">
                                                ${(item.precio * item.cantidad).toLocaleString()}
                                            </p>
                                            <button className="btn-remove" onClick={() => eliminarItem(item.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Columna de Resumen (Sticky) */}
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
                            <button className="btn-checkout">
                                Finalizar Pedido
                            </button>
                            <p className="secure-checkout">🔒 Pago seguro y encriptado</p>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Carrito;