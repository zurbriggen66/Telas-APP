import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Landmark, ArrowLeft, Check } from 'lucide-react';
import Navbar from '../Navbar/Navbar';
import './CheckoutSelection.css';

const CheckoutSelection = () => {
    const navigate = useNavigate();
    const [metodo, setMetodo] = useState('mercadopago');
    const [loading, setLoading] = useState(false);

    // Recuperamos el carrito para calcular el total y enviarlo a MP
    const [cart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const total = cart.reduce((acc, item) => acc + (Number(item.precio_por_metro) * item.cantidad), 0);

    const handleProcesarPago = async () => {
        if (metodo === 'transferencia') {
            alert("Esta funcionalidad estará disponible pronto. Por ahora, seleccioná Mercado Pago.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/mercadopago/preference/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: cart }),
            });

            const data = await response.json();
            
            if (data.id) {
                window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${data.id}`;
            } else {
                // ACÁ ESTÁ LA MAGIA: Mostramos el error exacto
                console.error("Error detallado de MP:", data);
                alert(`Mercado Pago rechazó la operación. \nMotivo: ${data.message || 'Revisá la consola (F12) para más detalles.'}`);
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
                    <p>Elegí el método de pago que prefieras</p>
                </header>

                <div className="checkout-selection-layout">
                    <div className="payment-options">
                        {/* Opción Mercado Pago */}
                        <div 
                            className={`payment-card ${metodo === 'mercadopago' ? 'active' : ''}`}
                            onClick={() => setMetodo('mercadopago')}
                        >
                            <div className="payment-card-icon">
                                <CreditCard size={24} strokeWidth={1.5} />
                            </div>
                            <div className="payment-card-info">
                                <h3>Mercado Pago</h3>
                                <p>Tarjetas de crédito, débito y dinero en cuenta.</p>
                            </div>
                            <div className="selection-indicator">
                                {metodo === 'mercadopago' && <Check size={16} color="white" />}
                            </div>
                        </div>

                        {/* Opción Transferencia */}
                        <div 
                            className={`payment-card disabled-option ${metodo === 'transferencia' ? 'active' : ''}`}
                            onClick={() => setMetodo('transferencia')}
                        >
                            <div className="payment-card-icon">
                                <Landmark size={24} strokeWidth={1.5} />
                            </div>
                            <div className="payment-card-info">
                                <h3>Transferencia Bancaria</h3>
                                <p>Próximamente disponible.</p>
                            </div>
                            <div className="selection-indicator">
                                {metodo === 'transferencia' && <Check size={16} color="white" />}
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
                        <button 
                            className="btn-pay-now" 
                            onClick={handleProcesarPago}
                            disabled={loading}
                        >
                            {loading ? "Cargando..." : "Confirmar y Pagar"}
                        </button>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default CheckoutSelection;