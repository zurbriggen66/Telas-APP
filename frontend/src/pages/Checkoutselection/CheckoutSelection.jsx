import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Landmark, ArrowLeft, Check, User } from 'lucide-react';
import Navbar from '../Navbar/Navbar';
import './CheckoutSelection.css';

const CheckoutSelection = () => {
    const navigate = useNavigate();
    const [metodo, setMetodo] = useState('mercadopago');
    const [loading, setLoading] = useState(false);

    // NUEVO ESTADO: Datos del comprador
    const [comprador, setComprador] = useState({
        nombre: '',
        apellido: '',
        email: '',
        dni: '',
        telefono: ''
    });

    const [cart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const total = cart.reduce((acc, item) => acc + (Number(item.precio_por_metro) * item.cantidad), 0);

    // Validación básica
    const formValido = comprador.nombre && comprador.apellido && comprador.email && comprador.dni;

    const handleInputChange = (e) => {
        setComprador({
            ...comprador,
            [e.target.name]: e.target.value
        });
    };

    const handleProcesarPago = async () => {
        if (!formValido) {
            alert("Por favor, completá todos tus datos personales para continuar.");
            return;
        }

        if (metodo === 'transferencia') {
            alert("Próximamente disponible.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/mercadopago/preference/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // AHORA MANDAMOS EL CARRITO Y LOS DATOS DEL CLIENTE
                body: JSON.stringify({ items: cart, payer: comprador }),
            });

            const data = await response.json();
            
            if (data.id) {
                window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${data.id}`;
            } else {
                console.error("Error detallado de MP:", data);
                alert("Mercado Pago rechazó la operación.");
            }
        } catch (error) {
            alert("Error de conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="checkout-selection-page">
            <Navbar cartCount={cart.length} />
            
            <div className="checkout-selection-container">
                <button className="back-button-simple" onClick={() => navigate('/carrito')}>
                    <ArrowLeft size={16} /> Volver a la bolsa
                </button>

                <header className="checkout-header">
                    <h1>Finalizar Compra</h1>
                    <p>Completá tus datos y elegí cómo pagar</p>
                </header>

                <div className="checkout-selection-layout">
                    <div className="checkout-left-column">
                        
                        {/* FORMULARIO DE DATOS */}
                        <div className="checkout-form-section">
                            <h3 style={{ fontFamily: 'Playfair Display', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <User size={20} /> Mis Datos
                            </h3>
                            <div className="form-grid">
                                <input type="text" name="nombre" placeholder="Nombre" value={comprador.nombre} onChange={handleInputChange} required />
                                <input type="text" name="apellido" placeholder="Apellido" value={comprador.apellido} onChange={handleInputChange} required />
                                <input type="email" name="email" placeholder="Correo electrónico" value={comprador.email} onChange={handleInputChange} className="full-width" required />
                                <input type="number" name="dni" placeholder="DNI" value={comprador.dni} onChange={handleInputChange} required />
                                <input type="tel" name="telefono" placeholder="Teléfono" value={comprador.telefono} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <div className="payment-options">
                            <div className={`payment-card ${metodo === 'mercadopago' ? 'active' : ''}`} onClick={() => setMetodo('mercadopago')}>
                                <div className="payment-card-icon"><CreditCard size={24} strokeWidth={1.5} /></div>
                                <div className="payment-card-info">
                                    <h3>Mercado Pago</h3>
                                    <p>Tarjetas de crédito, débito y dinero en cuenta.</p>
                                </div>
                                <div className="selection-indicator">{metodo === 'mercadopago' && <Check size={16} color="white" />}</div>
                            </div>
                            <div className={`payment-card disabled-option ${metodo === 'transferencia' ? 'active' : ''}`}>
                                <div className="payment-card-icon"><Landmark size={24} strokeWidth={1.5} /></div>
                                <div className="payment-card-info">
                                    <h3>Transferencia Bancaria</h3>
                                    <p>Próximamente disponible.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside className="checkout-summary">
                        <h2>Tu Pedido</h2>
                        <div className="summary-list">
                            {cart.map(item => (
                                <div key={item.id} className="summary-item-mini">
                                    <span>{item.nombre} ({item.cantidad}m)</span>
                                    <span>${(item.precio_por_metro * item.cantidad).toLocaleString('es-AR')}</span>
                                </div>
                            ))}
                        </div>
                        <div className="summary-total-line">
                            <span>Total a pagar</span>
                            <span className="total-amount">${total.toLocaleString('es-AR')}</span>
                        </div>
                        <button className="btn-pay-now" onClick={handleProcesarPago} disabled={loading || !formValido}>
                            {loading ? "Cargando..." : "Confirmar y Pagar"}
                        </button>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default CheckoutSelection;