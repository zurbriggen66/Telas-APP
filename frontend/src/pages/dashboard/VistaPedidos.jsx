import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Card from '../../components/Card';
import { Icon, icons } from '../../components/Icons';
import './VistaPedidos.css';

const VistaPedidos = () => {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // 👇 NUEVO ESTADO: Para controlar qué pedido se está mirando en detalle 👇
    const [pedidoEnDetalle, setPedidoEnDetalle] = useState(null);

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

    // --- FUNCIÓN: Generar Etiqueta (Envia.com) ---
    const handleGenerarEtiqueta = async (pedidoId) => {
        try {
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
                window.open(data.label_url, '_blank');
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
    const handleEliminarPedido = async (pedidoId) => {
        if (window.confirm(`¿Estás seguro de que querés eliminar el Pedido #${pedidoId}?`)) {
            try {
                const response = await fetch(`http://localhost:8000/api/pedidos/${pedidoId}/`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    alert("Pedido eliminado con éxito");
                    // Acá poné la función que recarga tus pedidos para que desaparezca de la tabla
                    // Ej: fetchPedidos();
                } else {
                    alert("Hubo un error al intentar eliminar el pedido");
                }
            } catch (error) {
                console.error("Error:", error);
            }
        }
    };

    // --- FUNCIÓN: Marcar como enviado localmente (Comisionista) ---
    const handleDespachoLocal = async (pedidoId) => {
        const confirmar = window.confirm("¿Confirmás que el comisionista ya se llevó el paquete?");
        if (!confirmar) return;

        try {
            const response = await fetch(`http://localhost:8000/api/pedidos/${pedidoId}/marcar_enviado/`, {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                alert('¡Pedido local marcado como enviado!');
                fetchPedidos(); 
                if(pedidoEnDetalle) setPedidoEnDetalle(null); // Cerramos el modal si estaba abierto
            } else {
                alert('Error al actualizar el estado del pedido.');
            }
        } catch (error) {
            console.error('Error al despachar localmente:', error);
            alert('Error de conexión al intentar actualizar el estado.');
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
                        <Icon d={icons.orders} size={48} color="#cbd5e1" />
                        <p className="empty-title">No hay pedidos todavía</p>
                        <p className="empty-subtitle">Cuando lleguen tus primeras ventas las verás aquí</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="pedidos-table">
                            <thead>
                                <tr>
                                    <th>Pedido</th>
                                    <th>Cliente</th>
                                    <th>Detalle de Telas</th>
                                    <th>Total & Método</th>
                                    <th>Acciones</th> 
                                </tr>
                            </thead>
                            <tbody>
                                {pedidos.map(pedido => {
                                    const esComisionista = pedido.tipo_envio && pedido.tipo_envio.includes('Comisionista');
                                    
                                    return (
                                        <tr key={pedido.id}>
                                            {/* CABECERA DE LA TARJETA (Móvil) / CELDA 1 (Escritorio) */}
                                            <td data-label="PEDIDO">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                    <div className="id-fecha-wrapper">
                                                        <strong className="pedido-id">#{pedido.id}</strong>
                                                        <span className="fecha-subtext">
                                                            {new Date(pedido.fecha_creacion).toLocaleDateString('es-AR')}
                                                        </span>
                                                    </div>
                                                    {/* El Estado ahora acompaña al ID para destacar */}
                                                    <span className={`badge-estado ${pedido.estado.toLowerCase()}`}>
                                                        {pedido.estado.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {/* DATOS DEL CLIENTE */}
                                            <td data-label="CLIENTE" className="cliente-cell">
                                                {pedido.email_cliente}
                                                <span className="fecha-subtext">{pedido.telefono_cliente}</span>
                                            </td>
                                            
                                            {/* DETALLE DE TELAS */}
                                            <td data-label="TELA A CORTAR">
                                                <div className="detalle-items-wrapper">
                                                    {(pedido.detalle_items || "").split('\n').map((line, index) => (
                                                        line ? <div key={index} className="detalle-linea">{line}</div> : null
                                                    ))}
                                                    {!pedido.detalle_items && (
                                                        <span style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.85rem' }}>Sin detalle</span>
                                                    )}
                                                </div>
                                            </td>
                                            
                                            {/* TOTAL Y MÉTODO AGRUPADOS */}
                                            <td data-label="TOTAL Y PAGO">
                                                <div className="total-cell">
                                                    ${Number(pedido.total).toLocaleString('es-AR')}
                                                </div>
                                                <div style={{ marginTop: '8px' }}>
                                                    <span className={`badge-metodo ${pedido.metodo_pago.toLowerCase().replace(' ', '-')}`}>
                                                        {pedido.metodo_pago}
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {/* BOTONES DE ACCIÓN LIMPIOS */}
                                            <td data-label="ACCIONES">
                                                <div className="acciones-container">
                                                    <button 
                                                        onClick={() => setPedidoEnDetalle(pedido)}
                                                        className="btn-accion btn-detalle"
                                                    >
                                                        🔍 Ver Detalle
                                                    </button>

                                                    {/* Botón para GENERAR por primera vez */}
                                                    {pedido.estado === 'Aprobado' && pedido.envia_carrier && !esComisionista && (
                                                        <button 
                                                            onClick={() => handleGenerarEtiqueta(pedido.id)}
                                                            className="btn-accion btn-primario"
                                                        >
                                                            📦 Etiqueta
                                                        </button>
                                                    )}

                                                    {/* Botón para Despacho Local */}
                                                    {pedido.estado === 'Aprobado' && esComisionista && (
                                                        <button 
                                                            onClick={() => handleDespachoLocal(pedido.id)}
                                                            className="btn-accion btn-success"
                                                        >
                                                            🛵 Despachar
                                                        </button>
                                                    )}

                                                    {/* ESTADO FINAL: ENVIADO */}
                                                    {pedido.estado === 'Enviado' && (
                                                        <>
                                                            {esComisionista ? (
                                                                <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', display: 'block', padding: '8px 0' }}>
                                                                    ✓ Entregado a Comisionista
                                                                </span>
                                                            ) : (
                                                                /* Si no es comisionista, mostramos el botón para abrir el PDF de nuevo */
                                                                pedido.url_etiqueta ? (
                                                                    <a 
                                                                        href={pedido.url_etiqueta} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="btn-accion"
                                                                        style={{ backgroundColor: '#e2e8f0', color: '#334155', textDecoration: 'none' }}
                                                                    >
                                                                        🖨️ Ver Etiqueta
                                                                    </a>
                                                                ) : (
                                                                    <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', display: 'block', padding: '8px 0' }}>
                                                                        ✓ Etiqueta Lista
                                                                    </span>
                                                                )
                                                            )}
                                                        </>
                                                    )}
                                                    <button 
                                                        onClick={() => handleEliminarPedido(pedido.id)}
                                                        className="btn-accion btn-eliminar"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* ... (Modal de Detalle) ... */}
            {pedidoEnDetalle && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center',
                    alignItems: 'center', zIndex: 9999, fontFamily: "'Montserrat', sans-serif"
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '30px', borderRadius: '12px',
                        width: '90%', maxWith: '500px', maxWidth: '480px', boxShadow: '0px 10px 25px rgba(0,0,0,0.15)',
                        position: 'relative', animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', color: '#1a1a1a' }}>
                            📋 Detalle - Pedido #{pedidoEnDetalle.id}
                        </h3>

                        {/* SECCIÓN 1: DATOS DEL CLIENTE */}
                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>👤 Comprador</h4>
                            <p style={{ margin: '3px 0', fontSize: '0.95rem' }}><strong>Nombre:</strong> {pedidoEnDetalle.nombre_cliente || 'No especificado'}</p>
                            <p style={{ margin: '3px 0', fontSize: '0.95rem' }}><strong>Email:</strong> {pedidoEnDetalle.email_cliente}</p>
                            <p style={{ margin: '3px 0', fontSize: '0.95rem' }}><strong>Teléfono:</strong> {pedidoEnDetalle.telefono_cliente || 'No registrado'}</p>
                        </div>

                        {/* SECCIÓN 2: DATOS DE LOGÍSTICA */}
                        <div style={{ marginBottom: '20px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🚚 Destino</h4>
                            <p style={{ margin: '4px 0', fontSize: '0.95rem' }}><strong>Modalidad:</strong> {pedidoEnDetalle.tipo_envio || 'Retiro en Local'}</p>
                            <p style={{ margin: '4px 0', fontSize: '0.95rem', color: '#1e293b' }}>
                                <strong>Dirección:</strong> <br />
                                <span style={{ inlineSize: '100%', display: 'inline-block', marginTop: '4px', fontSize: '1rem', color: '#0f172a', fontWeight: '500' }}>
                                    {pedidoEnDetalle.direccion_envio}
                                </span>
                            </p>
                        </div>

                        {/* SECCIÓN 3: MERCADERÍA */}
                        <div style={{ marginBottom: '25px' }}>
                            <h4 style={{ margin: '0 0 6px 0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>✂️ Telas a cortar</h4>
                            <div style={{ fontSize: '0.9rem', color: '#334155', maxHeight: '100px', overflowY: 'auto', backgroundColor: '#fafafa', padding: '10px', borderRadius: '6px' }}>
                                {(pedidoEnDetalle.detalle_items || "").split('\n').map((line, index) => (
                                    line ? <div key={index} style={{ padding: '2px 0' }}>{line}</div> : null
                                ))}
                            </div>
                        </div>  

                        {/* BOTONES DEL MODAL */}
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => setPedidoEnDetalle(null)}
                                style={{ padding: '10px 18px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#475569' }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VistaPedidos;