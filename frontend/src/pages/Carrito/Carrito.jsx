import React, { useState, useEffect } from 'react';
import { Trash2, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom'; // Agregamos useNavigate aquí
import Navbar from '../Navbar/Navbar.jsx';
import './Carrito.css';

const Carrito = () => {
    // Inicializamos la herramienta para cambiar de página
    const navigate = useNavigate();

    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const total = cart.reduce((acc, item) => acc + (Number(item.precio_por_metro) * item.cantidad), 0);

    const eliminarItem = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    // NUEVA FUNCIÓN: Simplemente te lleva a la pantalla de selección de pago
    const handleIrAlCheckout = () => {
        navigate('/checkout'); 
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
                            <div className="summary-details">
                                <div className="summary-line">
                                    <span>Subtotal</span>
                                    <span>${total.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="summary-line">
                                    <span>Envío</span>
                                    <span className="free-shipping">Por acordar</span>
                                </div>
                                <div className="summary-line total">
                                    <span>Total Estimado</span>
                                    <span>${total.toLocaleString('es-AR')}</span>
                                </div>
                            </div>

                            {/* EL BOTÓN ACTUALIZADO */}
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