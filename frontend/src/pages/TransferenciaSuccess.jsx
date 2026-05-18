import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar/Navbar';

const TransferenciaSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Recuperamos los datos que pasamos desde el Checkout
    const { pedidoId, total, cliente } = location.state || {};

    if (!pedidoId) {
        return (
            <div>
                <Navbar cartCount={0} />
                <div style={{ padding: '50px', textAlign: 'center' }}>
                    <h2>No hay información del pedido.</h2>
                    <button onClick={() => navigate('/')}>Volver al inicio</button>
                </div>
            </div>
        );
    }

    const mensajeWpp = `Hola! Soy ${cliente}. Acabo de realizar el pedido #${pedidoId} por $${total}. Te adjunto el comprobante de transferencia:`;
    const wppLink = `https://wa.me/5493562517046?text=${encodeURIComponent(mensajeWpp)}`;

    return (
        <div className="success-page">
            <Navbar cartCount={0} />
            <div className="success-container" style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <h1 style={{ color: '#2ecc71', marginBottom: '20px' }}>¡Pedido Reservado con Éxito!</h1>
                <p>Tu pedido <strong>#{pedidoId}</strong> ha sido registrado. Las telas ya están apartadas para vos.</p>
                
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #eee', margin: '20px 0', textAlign: 'left' }}>
                    <h3 style={{ marginBottom: '15px' }}>Datos para la transferencia:</h3>
                    <p><strong>Total a transferir:</strong> ${total.toLocaleString('es-AR')}</p>
                    <p><strong>CBU/CVU:</strong> 0123456789012345678901</p>
                    <p><strong>Alias:</strong> TELAS.APP.CBA</p>
                    <p><strong>Titular:</strong> Ignacio Zurbriggen</p>
                </div>

                <p style={{ marginBottom: '20px' }}>Una vez realizada la transferencia, envianos el comprobante para aprobar el envío.</p>

                <a href={wppLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', backgroundColor: '#25D366', color: 'white', padding: '12px 24px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>
                    Enviar Comprobante por WhatsApp
                </a>
            </div>
        </div>
    );
};

export default TransferenciaSuccess;