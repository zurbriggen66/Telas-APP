import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Card from '../../components/Card';
import { Icon, icons } from '../../components/Icons';
import './VistaTransferencias.css';

const VistaTransferencias = () => {
    const [pedidosPendientes, setPedidosPendientes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estado para manejar nuestra ventana emergente (Modal) profesional
    const [modal, setModal] = useState({ isOpen: false, tipo: '', pedidoId: null, cargando: false });

    const fetchPendientes = async () => {
        try {
            const response = await fetch(import.meta.env.VITE_API_URL + '/api/pedidos/');
            const data = await response.json();
            const filtrados = data.filter(pedido => pedido.estado === 'Esperando_Transferencia');
            setPedidosPendientes(filtrados);
        } catch (error) {
            console.error("Error al cargar transferencias:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendientes();
    }, []);

    const abrirModal = (tipo, pedidoId) => {
        setModal({ isOpen: true, tipo, pedidoId, cargando: false });
    };

    const cerrarModal = () => {
        setModal({ isOpen: false, tipo: '', pedidoId: null, cargando: false });
    };

    const confirmarAccion = async () => {
        setModal(prev => ({ ...prev, cargando: true }));
        const endpoint = modal.tipo === 'aprobar' ? 'aprobar_transferencia' : 'cancelar_transferencia';

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pedidos/${modal.pedidoId}/${endpoint}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                fetchPendientes(); // Recargamos la lista
                cerrarModal();
            } else {
                alert("Hubo un error en el servidor al procesar la acción.");
                setModal(prev => ({ ...prev, cargando: false }));
            }
        } catch (error) {
            console.error("Error de red:", error);
            alert("Error de conexión con el servidor.");
            setModal(prev => ({ ...prev, cargando: false }));
        }
    };

    if (loading) {
        return (
            <div className="vista-transferencias-container">
                <Header title="Validar Transferencias" subtitle="Aprobá o rechazá los pagos manuales" />
                <Card><div className="loading-state">Buscando transferencias pendientes...</div></Card>
            </div>
        );
    }

    return (
        <div className="vista-transferencias-container">
            <Header title="Validar Transferencias" subtitle="Aprobá o rechazá los pagos manuales" />
            
            <Card>
                {pedidosPendientes.length === 0 ? (
                    <div className="transferencias-empty">
                        <Icon d={icons.bank} size={48} color="#cbd5e1" />
                        <p className="empty-title">¡Todo al día!</p>
                        <p className="empty-subtitle">No hay pedidos pendientes de revisión bancaria.</p>
                    </div>
                ) : (
                    <div className="grid-transferencias">
                        {pedidosPendientes.map(pedido => (
                            <div key={pedido.id} className="transferencia-card">
                                <div className="transferencia-header">
                                    <div>
                                        <span className="badge-transferencia">Por Revisar</span>
                                        <h3 className="pedido-titulo">Pedido #{pedido.id}</h3>
                                    </div>
                                    <span className="monto-destacado">${Number(pedido.total).toLocaleString('es-AR')}</span>
                                </div>
                                
                                <div className="transferencia-body">
                                    <div className="info-grupo">
                                        <span className="info-label">Cliente</span>
                                        <span className="info-valor">{pedido.nombre_cliente}</span>
                                    </div>
                                    <div className="info-grupo">
                                        <span className="info-label">Contacto</span>
                                        <span className="info-valor">{pedido.telefono_cliente} <br/> {pedido.email_cliente}</span>
                                    </div>
                                    <div className="info-grupo">
                                        <span className="info-label">Fecha del Pedido</span>
                                        <span className="info-valor">{new Date(pedido.fecha_creacion).toLocaleDateString('es-AR')}</span>
                                    </div>
                                    
                                    <div className="detalle-telas-box">
                                        <span className="info-label">Telas a cortar:</span>
                                        <div className="telas-lista">
                                            {(pedido.detalle_items || "Esperando detalle de nuevas compras...").split('\n').map((line, idx) => (
                                                line && <div key={idx} className="tela-line">{line}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="transferencia-footer">
                                    <button 
                                        className="btn-accion btn-rechazar" 
                                        onClick={() => abrirModal('rechazar', pedido.id)}
                                    >
                                        Rechazar
                                    </button>
                                    <button 
                                        className="btn-accion btn-aprobar" 
                                        onClick={() => abrirModal('aprobar', pedido.id)}
                                    >
                                        Aprobar Pago
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* MODAL DE CONFIRMACIÓN CUSTOM */}
            {modal.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{modal.tipo === 'aprobar' ? '¿Aprobar este pago?' : '¿Rechazar este pedido?'}</h2>
                        <p>
                            {modal.tipo === 'aprobar' 
                                ? 'Al confirmar, el cliente recibirá un email automático avisando que su pago ingresó y que prepararás su pedido.' 
                                : 'Al rechazar, el pedido se cancelará y los metros de tela volverán automáticamente a estar disponibles en tu stock.'}
                        </p>
                        <div className="modal-actions">
                            <button className="btn-modal-cerrar" onClick={cerrarModal} disabled={modal.cargando}>
                                Cancelar
                            </button>
                            <button 
                                className={`btn-modal-confirmar ${modal.tipo}`} 
                                onClick={confirmarAccion}
                                disabled={modal.cargando}
                            >
                                {modal.cargando ? 'Procesando...' : (modal.tipo === 'aprobar' ? 'Sí, Aprobar Pago' : 'Sí, Rechazar y devolver stock')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VistaTransferencias;