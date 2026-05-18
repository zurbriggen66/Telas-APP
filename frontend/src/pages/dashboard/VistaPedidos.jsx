import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Card from '../../components/Card';
import { Icon, icons } from '../../components/Icons';
import './VistaPedidos.css';

const VistaPedidos = () => {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

        fetchPedidos();
    }, []);

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
        {/* Reemplazá la validación de tu línea 75 por esta: */}
{(pedido.detalle_items || "").split('\n').map((line, index) => (
    line ? <div key={index} className="detalle-linea">{line}</div> : null
))}
{/* Si no hay detalle, mostramos este texto especial */}
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