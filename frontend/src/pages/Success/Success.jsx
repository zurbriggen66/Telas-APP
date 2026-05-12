import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Navbar from '../Navbar/Navbar';
import './Success.css';

const Success = () => {
    const [estado, setEstado] = useState('procesando');
    const navigate = useNavigate();
    const peticionHecha = useRef(false); 

    useEffect(() => {
        if (peticionHecha.current) return;
        peticionHecha.current = true;

        // El webhook del backend ya se encargó del stock de forma invisible.
        // Nosotros solo vaciamos el carrito del navegador.
        localStorage.removeItem('cart');
        
        // Le damos 1.5 segundos de "procesando" para que quede profesional
        setTimeout(() => {
            setEstado('exito');
        }, 1500);

    }, []);

    return (
        <div className="success-page">
            <Navbar cartCount={0} />
            
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
            </div>
        </div>
    );
};

export default Success;