import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Card from '../../components/Card';
import { Icon, icons } from '../../components/Icons';
import './VistaPedidos.css';

const VistaPedidos = () => {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPedidos = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/pedidos/');
            const data = await response.json();
            setPedidos(data);
        } catch (error) {
            console.error("Error al cargar los pedidos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPedidos();
    }, []);

    // --- NUEVA FUNCIÓN: Generar Etiqueta ---
    const handleGenerarEtiqueta = async (pedidoId) => {
        try {
            // Nota: Si tenés un sistema de login para el admin, descomentá estas líneas para enviar el token:
             const token = localStorage.getItem('access_token');
            
            const response = await fetch(`http://localhost:8000/api/pedidos/${pedidoId}/generar-etiqueta/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                     'Authorization': `Bearer ${token}` 
                }
            });

            const data = await response.json();

            if (response.ok) {
                alert('¡Etiqueta generada con éxito!');
                // Abrimos el PDF en una pestaña nueva
                window.open(data.label_url, '_blank');
                // Recargamos la lista para que el estado pase a "Enviado" visualmente
                fetchPedidos();
            } else {
                alert(`Error: ${data.error || 'No se pudo generar'}`);
                console.error(data.detalle);
            }
        } catch (error) {
            console.error('Error al generar la etiqueta:', error);
            alert('Error de conexión al intentar generar la etiqueta.');
        }
    };

    if (loading) {
        return (
            <div>
                <Header title="Ventas & Pedidos" subtitle="Administrá tus órdenes de compra" />
                <Card><div className="pedidos-loading">Cargando tu historial de ventas...</div></Card>
            </div>
        );
    }

    return (
        <div className="vista-pedidos-container">
            <Header title="Ventas & Pedidos" subtitle="Administrá tus órdenes de compra" />
            
            <Card>
                {pedidos.length === 0 ? (
                    <div className="pedidos-empty-state">
                        <Icon d={icons.orders} size={40} color="#e2e8f0" />
                        <p className="empty-title">No hay pedidos todavía</p>
                        <p className="empty-subtitle">Cuando lleguen tus primeras ventas las verás aquí</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="pedidos-table">
                            <thead>
                                <tr>
                                    <th>ID / Fecha</th>
                                    <th>Cliente</th>
                                    <th>Detalle de Telas</th>
                                    <th>Método</th>
                                    <th>Total</th>
                                    <th>Estado</th>
                                    {/* NUEVA COLUMNA */}
                                    <th>Acciones</th> 
                                </tr>
                            </thead>
                            <tbody>
                                {pedidos.map(pedido => (
                                    <tr key={pedido.id}>
                                        <td data-label="ID / FECHA">
                                            <div className="id-fecha-wrapper">
                                                <strong className="pedido-id">#{pedido.id}</strong>
                                                <span className="fecha-subtext">
                                                    {new Date(pedido.fecha_creacion).toLocaleDateString('es-AR')}
                                                </span>
                                            </div>
                                        </td>
                                        <td data-label="CLIENTE" className="cliente-cell">
                                            {pedido.email_cliente}
                                        </td>
                                        <td data-label="TELA A CORTAR" className="detalle-cell">
                                            <div className="detalle-items-wrapper">
                                                {(pedido.detalle_items || "").split('\n').map((line, index) => (
                                                    line ? <div key={index} className="detalle-linea">{line}</div> : null
                                                ))}
                                                {!pedido.detalle_items && (
                                                    <div style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.85rem' }}>
                                                        Sin detalle guardado
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td data-label="MÉTODO DE PAGO">
                                            <span className={`badge-metodo ${pedido.metodo_pago.toLowerCase().replace(' ', '-')}`}>
                                                {pedido.metodo_pago}
                                            </span>
                                        </td>
                                        <td data-label="TOTAL COBRADO" className="total-cell">
                                            ${Number(pedido.total).toLocaleString('es-AR')}
                                        </td>
                                        <td data-label="ESTADO DEL PEDIDO">
                                            <span className={`badge-estado ${pedido.estado.toLowerCase()}`}>
                                                {pedido.estado}
                                            </span>
                                        </td>
                                        
                                        {/* NUEVA CELDA DE ACCIONES */}
                                        <td data-label="ACCIONES">
                                            {/* Solo mostramos el botón si está Aprobado y eligió un correo */}
                                            {pedido.estado === 'Aprobado' && pedido.envia_carrier && (
                                                <button 
                                                    onClick={() => handleGenerarEtiqueta(pedido.id)}
                                                    style={{
                                                        backgroundColor: '#1A1A1A', color: 'white', padding: '8px 12px', 
                                                        borderRadius: '4px', border: 'none', cursor: 'pointer', 
                                                        fontSize: '0.8rem', whiteSpace: 'nowrap', width: '100%'
                                                    }}
                                                >
                                                    📦 Generar Etiqueta
                                                </button>
                                            )}

                                            {/* Opcional: Feedback si ya se despachó o si es retiro local */}
                                            {pedido.estado === 'Enviado' && (
                                                <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 500 }}>
                                                    ✓ Etiqueta lista
                                                </span>
                                            )}
                                            {(!pedido.envia_carrier && pedido.estado === 'Aprobado') && (
                                                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                                    Retiro Local
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default VistaPedidos;