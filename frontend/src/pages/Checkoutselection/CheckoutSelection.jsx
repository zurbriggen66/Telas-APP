import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Landmark, ArrowLeft, Check, User, MapPin } from 'lucide-react';
import Navbar from '../Navbar/Navbar';
import './CheckoutSelection.css';

const CheckoutSelection = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const datosEnvio = location.state || { 
        costoEnvio: 0, 
        codigoPostal: '', 
        tipoEnvio: 'Desconocido' 
    };

    const [metodo, setMetodo] = useState('mercadopago');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [metodoEntrega, setMetodoEntrega] = useState('envio'); 

    // --- ESTADOS PARA ENVÍO ---
    const [opcionesEnvio, setOpcionesEnvio] = useState([]);
    const [opcionEnvioSeleccionada, setOpcionEnvioSeleccionada] = useState(null); 
    const [isLoadingCotizacion, setIsLoadingCotizacion] = useState(false);
    const [errorCotizacion, setErrorCotizacion] = useState('');

    const [comprador, setComprador] = useState({
        nombre: '', apellido: '', email: '', dni: '', telefono: '',
        calle: '', numero: '', codigoPostal: datosEnvio.codigoPostal || '' 
    });

    const [cart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const subtotalTelas = cart.reduce((acc, item) => acc + (Number(item.precio_por_metro) * item.cantidad), 0);
    const costoEnvioFinal = metodoEntrega === 'retiro' ? 0 : (opcionEnvioSeleccionada ? opcionEnvioSeleccionada.costo : 0);
    const totalAPagar = subtotalTelas + costoEnvioFinal;

    const formValido = 
        comprador.nombre && comprador.apellido && comprador.email && 
        comprador.dni && comprador.telefono && 
        (metodoEntrega === 'retiro' || (comprador.calle && comprador.numero && comprador.codigoPostal));

    // --- FUNCIÓN PARA COTIZAR Y FILTRAR ---
    const handleCotizarEnCheckout = async () => {
        if (!comprador.codigoPostal || comprador.codigoPostal.trim() === '') {
            setErrorCotizacion('Ingresá tu Código Postal');
            return;
        }

        setIsLoadingCotizacion(true);
        setErrorCotizacion('');
        setOpcionesEnvio([]);
        setOpcionEnvioSeleccionada(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cotizar-envio/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo_postal: comprador.codigoPostal })
            });

            const data = await response.json();

            if (data.error) {
                setErrorCotizacion(data.mensaje || 'Error al cotizar');
            } else if (data.opciones && data.opciones.length > 0) {
                
                // Filtramos solo envíos a domicilio
                const opcionesFiltradas = data.opciones.filter(opcion => {
                    const servicioStr = (opcion.servicio || '').toLowerCase();
                    return servicioStr.includes('domicilio') && !servicioStr.includes('sucursal');
                });

                if (opcionesFiltradas.length === 0) {
                    setErrorCotizacion('No hay opciones de envío a domicilio para este CP.');
                    setIsLoadingCotizacion(false);
                    return;
                }

                const opcionesConIdsUnicos = opcionesFiltradas.map((opcion, index) => ({
                    ...opcion,
                    id_unico: `${opcion.proveedor}-${opcion.servicio}-${index}`
                }));

                setOpcionesEnvio(opcionesConIdsUnicos);
                setOpcionEnvioSeleccionada(opcionesConIdsUnicos[0]); 
            } else if (data.tipo === 'Local') {
                const opcionLocal = { id_unico: 'local_0', proveedor: data.proveedor, servicio: 'Comisionista', costo: data.costo, tiempo_entrega: '24-48hs' };
                setOpcionesEnvio([opcionLocal]);
                setOpcionEnvioSeleccionada(opcionLocal);
            }
        } catch (error) {
            setErrorCotizacion('Error de conexión con el servidor.');
        } finally {
            setIsLoadingCotizacion(false);
        }
    };

    const handleInputChange = (e) => {
        setComprador({ ...comprador, [e.target.name]: e.target.value });
        if (errorMsg) setErrorMsg('');
        
        if (e.target.name === 'codigoPostal') {
            setOpcionesEnvio([]);
            setOpcionEnvioSeleccionada(null);
            setErrorCotizacion('');
        }
    };

    const handleProcesarPago = async () => {
        if (!formValido) {
            setErrorMsg("Faltan completar algunos datos. Revisá el formulario.");
            return;
        }

        if (metodoEntrega === 'envio' && !opcionEnvioSeleccionada) {
            setErrorMsg("Por favor, calculá el costo de envío y seleccioná una opción.");
            return;
        }

        setLoading(true);
        try {
            const metodoPagoBackend = metodo === 'mercadopago' ? 'Mercado Pago' : 'Transferencia';
            const direccionFinal = metodoEntrega === 'retiro' 
                ? "🏪 Retira en el local" 
                : `${comprador.calle} ${comprador.numero}, CP: ${comprador.codigoPostal}`;

            const compradorConEnvio = { ...comprador, direccion_envio: direccionFinal };

            const payload = {
                items: cart, 
                payer: compradorConEnvio, 
                metodo_pago: metodoPagoBackend,
                costo_envio: costoEnvioFinal,
                tipo_envio: metodoEntrega === 'retiro' ? 'Retiro en Local' : `${opcionEnvioSeleccionada.proveedor} - ${opcionEnvioSeleccionada.servicio}`,
                envia_carrier: metodoEntrega === 'retiro' ? null : (opcionEnvioSeleccionada.carrier_code || opcionEnvioSeleccionada.id || 'correoargentino'),
                envia_service: metodoEntrega === 'retiro' ? null : (opcionEnvioSeleccionada.service_code || 'estandar'),
                total: totalAPagar
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pedidos/crear/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            
            if (response.ok) {
                localStorage.removeItem('cart');
                if (data.status === 'redirect_mp') {
                    window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${data.preference_id}`;
                } else if (data.status === 'awaiting_transfer') {
                    navigate('/transferencia-success', { 
                        state: { pedidoId: data.pedido_id, total: totalAPagar, cliente: comprador.nombre } 
                    });
                }
            } else {
                setErrorMsg(data.error || "Hubo un problema al procesar tu pedido.");
            }
        } catch (error) {
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
                            <h3 className="section-title"><User size={20} /> Mis Datos Personales</h3>
                            <div className="form-grid">
                                <input type="text" name="nombre" placeholder="Nombre" value={comprador.nombre} onChange={handleInputChange} required />
                                <input type="text" name="apellido" placeholder="Apellido" value={comprador.apellido} onChange={handleInputChange} required />
                                <input type="email" name="email" placeholder="Correo electrónico" value={comprador.email} onChange={handleInputChange} className="full-width" required />
                                <input type="number" name="dni" placeholder="DNI" value={comprador.dni} onChange={handleInputChange} required />
                                <input type="tel" name="telefono" placeholder="Celular" value={comprador.telefono} onChange={handleInputChange} required />
                            </div>

                            <h3 className="section-title" style={{ marginTop: '35px' }}><MapPin size={20} /> Método de Entrega</h3>
                            
                            <div className="opciones-entrega-container">
                                <label className={`metodo-entrega-card ${metodoEntrega === 'envio' ? 'active' : ''}`}>
                                    <input type="radio" value="envio" checked={metodoEntrega === 'envio'} onChange={(e) => setMetodoEntrega(e.target.value)} />
                                    <span style={{ fontWeight: 500, color: '#1A1A1A' }}>🚚 Envío a domicilio</span>
                                </label>
                                <label className={`metodo-entrega-card ${metodoEntrega === 'retiro' ? 'active' : ''}`}>
                                    <input type="radio" value="retiro" checked={metodoEntrega === 'retiro'} onChange={(e) => setMetodoEntrega(e.target.value)} />
                                    <span style={{ fontWeight: 500, color: '#1A1A1A' }}>🏪 Retira en el local</span>
                                </label>
                            </div>

                            {metodoEntrega === 'envio' && (
                                <div className="datos-envio-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                    <div className="form-grid">
                                        <input type="text" name="calle" placeholder="Calle / Barrio" value={comprador.calle} onChange={handleInputChange} className="full-width" required />
                                        <input type="text" name="numero" placeholder="Número / Piso / Depto" value={comprador.numero} onChange={handleInputChange} required />
                                        
                                        <div className="full-width" style={{ display: 'flex', gap: '10px', width: '100%', minWidth: '0' }}>
    <input type="text" name="codigoPostal" placeholder="Código Postal" value={comprador.codigoPostal} onChange={handleInputChange} required style={{ flex: 1, minWidth: '0' }} />
    <button 
        type="button" 
        onClick={handleCotizarEnCheckout}
        disabled={isLoadingCotizacion || !comprador.codigoPostal}
        style={{
            backgroundColor: '#1A1A1A', color: 'white', border: 'none', padding: '0 15px', borderRadius: '6px', 
            cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 500
        }}
    >
        {isLoadingCotizacion ? '...' : 'Cotizar'}
    </button>
</div>
                                    </div>
                                    
                                    {errorCotizacion && <p style={{ color: '#D9534F', fontSize: '0.85rem', marginTop: '10px' }}>{errorCotizacion}</p>}
                                    
                                    {opcionesEnvio.length > 0 && (
                                        <div className="envio-cards-container">
                                            <p style={{ fontSize: '0.85rem', color: '#555', margin: 0, fontWeight: 500 }}>Elegí una opción de envío:</p>
                                            
                                            {opcionesEnvio.map((opcion) => {
                                                const estaSeleccionada = opcionEnvioSeleccionada?.id_unico === opcion.id_unico;
                                                
                                                // Logo nativo de Wikipedia (Nunca se rompe)
                                                const esCorreoArgentino = opcion.carrier_code === 'correoargentino' || opcion.proveedor.toLowerCase().includes('correo argentino');
                                                const logoUrl = esCorreoArgentino 
                                                    ? 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Correo_Argentino_logo.svg/512px-Correo_Argentino_logo.svg.png' 
                                                    : 'https://cdn-icons-png.flaticon.com/512/1976/1976602.png'; 
                                                
                                                const nombreServicioLimpio = opcion.servicio.replace(opcion.proveedor, '').trim();

                                                return (
                                                    <div 
                                                        key={opcion.id_unico} 
                                                        className={`envio-card ${estaSeleccionada ? 'selected' : ''}`}
                                                        onClick={() => setOpcionEnvioSeleccionada(opcion)}
                                                    >
                                                        {/* LADO IZQUIERDO */}
                                                        <div className="envio-card-left">
                                                            <div 
                                                                className="envio-logo" 
                                                                style={{ backgroundImage: `url(${logoUrl})` }} 
                                                            />
                                                            
                                                            <div className="envio-info">
                                                                <strong className="envio-proveedor">{opcion.proveedor}</strong>
                                                                <span className="envio-detalle">{nombreServicioLimpio} • {opcion.tiempo_entrega}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* LADO DERECHO */}
                                                        <div className="envio-card-right">
                                                            <div className="envio-precio">
                                                                ${opcion.costo.toLocaleString('es-AR')}
                                                            </div>
                                                            <div className="envio-check">
                                                                {estaSeleccionada && <Check size={14} color="white" strokeWidth={3} />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

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
                            
                            <div className="summary-item-mini" style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '5px' }}>
                                <span>Envío {metodoEntrega === 'envio' && comprador.codigoPostal ? `(CP: ${comprador.codigoPostal})` : ''}</span>
                                <span>{costoEnvioFinal > 0 ? `$${costoEnvioFinal.toLocaleString('es-AR')}` : (metodoEntrega === 'retiro' ? 'Gratis' : 'A calcular')}</span>
                            </div>
                        </div>

                        <div className="summary-total-line">
                            <span>Total a pagar</span>
                            <span className="total-amount">${totalAPagar.toLocaleString('es-AR')}</span>
                        </div>
                        
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