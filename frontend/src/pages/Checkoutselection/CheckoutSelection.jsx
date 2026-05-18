import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Landmark, ArrowLeft, Check, User, MapPin } from 'lucide-react';
import Navbar from '../Navbar/Navbar';
import './CheckoutSelection.css';

const CheckoutSelection = () => {
    const navigate = useNavigate();
    const [metodo, setMetodo] = useState('mercadopago');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(''); // Estado para el mensaje de error sutil

    // 1. Ampliamos el estado con los nuevos campos de dirección
    const [comprador, setComprador] = useState({
        nombre: '',
        apellido: '',
        email: '',
        dni: '',
        telefono: '',
        calle: '',
        numero: '',
        codigoPostal: ''
    });

    const [cart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const total = cart.reduce((acc, item) => acc + (Number(item.precio_por_metro) * item.cantidad), 0);

    // 2. Nueva validación exigiendo todos los campos
    const formValido = 
        comprador.nombre && comprador.apellido && comprador.email && 
        comprador.dni && comprador.telefono && comprador.calle && 
        comprador.numero && comprador.codigoPostal;

    const handleInputChange = (e) => {
        setComprador({
            ...comprador,
            [e.target.name]: e.target.value
        });
        // Si el usuario empieza a escribir de nuevo, limpiamos el error
        if (errorMsg) setErrorMsg('');
    };

    const handleProcesarPago = async () => {
        // 3. Validación delicada en vez del window.alert
        if (!formValido) {
            setErrorMsg("Faltan completar algunos datos. Revisá el formulario para poder preparar tu envío.");
            return;
        }

        setLoading(true);
        try {
            const metodoPagoBackend = metodo === 'mercadopago' ? 'Mercado Pago' : 'Transferencia';

            const response = await fetch('http://localhost:8000/api/pedidos/crear/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    items: cart, 
                    payer: comprador,
                    metodo_pago: metodoPagoBackend
                }),
            });

            const data = await response.json();
            
            if (response.ok) {
                localStorage.removeItem('cart');

                if (data.status === 'redirect_mp') {
                    window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${data.preference_id}`;
                } else if (data.status === 'awaiting_transfer') {
                    navigate('/transferencia-success', { 
                        state: { 
                            pedidoId: data.pedido_id, 
                            total: data.total,
                            cliente: comprador.nombre
                        } 
                    });
                }
            } else {
                console.error("Error del backend:", data);
                setErrorMsg(data.error || "Hubo un problema al procesar tu pedido.");
            }
        } catch (error) {
            console.error("Error de red:", error);
            setErrorMsg("Error de conexión con el servidor. Revisá tu internet.");
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
                        
                        <div className="checkout-form-section">
                            {/* BLOQUE DATOS PERSONALES */}
                            <h3 className="section-title">
                                <User size={20} /> Mis Datos Personales
                            </h3>
                            <div className="form-grid">
                                <input type="text" name="nombre" placeholder="Nombre" value={comprador.nombre} onChange={handleInputChange} required />
                                <input type="text" name="apellido" placeholder="Apellido" value={comprador.apellido} onChange={handleInputChange} required />
                                <input type="email" name="email" placeholder="Correo electrónico" value={comprador.email} onChange={handleInputChange} className="full-width" required />
                                <input type="number" name="dni" placeholder="DNI" value={comprador.dni} onChange={handleInputChange} required />
                                <input type="tel" name="telefono" placeholder="Celular" value={comprador.telefono} onChange={handleInputChange} required />
                            </div>

                            {/* BLOQUE DIRECCIÓN DE ENVÍO */}
                            <h3 className="section-title" style={{ marginTop: '35px' }}>
                                <MapPin size={20} /> Datos de Envío
                            </h3>
                            <div className="form-grid">
                                <input type="text" name="calle" placeholder="Calle / Barrio" value={comprador.calle} onChange={handleInputChange} className="full-width" required />
                                <input type="text" name="numero" placeholder="Número / Piso / Depto" value={comprador.numero} onChange={handleInputChange} required />
                                <input type="text" name="codigoPostal" placeholder="Código Postal" value={comprador.codigoPostal} onChange={handleInputChange} required />
                            </div>

                            {/* MENSAJE DE ERROR SUTIL */}
                            {errorMsg && (
                                <div className="error-message-subtle">
                                    {errorMsg}
                                </div>
                            )}
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
                            
                            <div className={`payment-card ${metodo === 'transferencia' ? 'active' : ''}`} onClick={() => setMetodo('transferencia')}>
                                <div className="payment-card-icon"><Landmark size={24} strokeWidth={1.5} /></div>
                                <div className="payment-card-info">
                                    <h3>Transferencia Bancaria</h3>
                                    <p>Transferí desde tu banco o billetera virtual.</p>
                                </div>
                                <div className="selection-indicator">{metodo === 'transferencia' && <Check size={16} color="white" />}</div>
                            </div>
                        </div>
                    </div>

                    <aside className="checkout-summary">
                        <h2>Tu Pedido</h2>
                        <div className="summary-list">
                            {cart.map((item, index) => (
                                <div key={index} className="summary-item-mini">
                                    <span>{item.nombre} ({item.cantidad}m)</span>
                                    <span>${(item.precio_por_metro * item.cantidad).toLocaleString('es-AR')}</span>
                                </div>
                            ))}
                        </div>
                        <div className="summary-total-line">
                            <span>Total a pagar</span>
                            <span className="total-amount">${total.toLocaleString('es-AR')}</span>
                        </div>
                        {/* El botón siempre está clickeable, pero si faltan datos muestra el error arriba */}
                        <button className="btn-pay-now" onClick={handleProcesarPago} disabled={loading}>
                            {loading ? "Procesando..." : "Confirmar y Pagar"}
                        </button>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default CheckoutSelection;