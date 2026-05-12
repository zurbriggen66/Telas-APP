import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Navbar from '../Navbar/Navbar';
import './Success.css';

const Success = () => {
    const [estado, setEstado] = useState('procesando'); // Puede ser: procesando, exito, error
    const navigate = useNavigate();
    
    // Usamos useRef para evitar que React (en modo estricto) dispare el descuento 2 veces
    const peticionHecha = useRef(false); 

    useEffect(() => {
        if (peticionHecha.current) return;
        peticionHecha.current = true;

        const confirmarPago = async () => {
            const cartGuardado = localStorage.getItem('cart');
            
            // Si el carrito está vacío, asumimos que ya se procesó antes o entró por error
            if (!cartGuardado || JSON.parse(cartGuardado).length === 0) {
                setEstado('exito');
                return;
            }

            const cart = JSON.parse(cartGuardado);

            try {
                // Le avisamos a tu backend en Django que descuente los metros de la base de datos
                const response = await fetch('http://localhost:8000/api/pedidos/confirmar/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: cart })
                });

                if (response.ok) {
                    // Si Django responde OK, vaciamos el carrito del navegador
                    localStorage.removeItem('cart');
                    setEstado('exito');
                } else {
                    console.error("Error al descontar stock");
                    setEstado('error');
                }
            } catch (error) {
                console.error("Error de conexión:", error);
                setEstado('error');
            }
        };

        confirmarPago();
    }, []);

    return (
        <div className="success-page">
            <Navbar cartCount={0} /> {/* Forzamos el 0 porque ya se compró */}
            
            <div className="success-container">
                {estado === 'procesando' && (
                    <div className="success-card">
                        <h2>Procesando tu compra...</h2>
                        <p>Por favor, no cierres esta ventana.</p>
                    </div>
                )}
                
                {estado === 'exito' && (
                    <div className="success-card">
                        <CheckCircle size={80} color="#10b981" strokeWidth={1.5} />
                        <h1>¡Gracias por tu compra!</h1>
                        <p>Tu pago se ha procesado con éxito y tus telas ya están reservadas.</p>
                        <p className="success-details">Nos pondremos en contacto contigo pronto para coordinar la entrega.</p>
                        
                        <button className="btn-home" onClick={() => navigate('/')}>
                            Volver a la tienda
                        </button>
                    </div>
                )}

                {estado === 'error' && (
                    <div className="success-card">
                        <h2>Hubo un detalle con tu orden</h2>
                        <p>Tu pago se realizó correctamente en Mercado Pago, pero tuvimos un inconveniente sincronizando el stock.</p>
                        <p>Por favor, contactanos por WhatsApp con tu comprobante.</p>
                        <button className="btn-home" onClick={() => navigate('/')}>
                            Volver a la tienda
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Success;