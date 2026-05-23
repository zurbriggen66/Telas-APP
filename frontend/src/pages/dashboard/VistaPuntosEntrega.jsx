import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Card from '../../components/Card';
import { Icon, icons } from '../../components/Icons';

const VistaPuntosEntrega = () => {
    const [puntos, setPuntos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);

    const [formData, setFormData] = useState({
        codigo_postal: '',
        localidad: '',
        costo_envio: '',
        activo: true
    });

    const fetchPuntos = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tarifas-locales/`);
            const data = await response.json();
            setPuntos(data);
        } catch (error) {
            console.error("Error al cargar puntos de entrega:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPuntos();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const abrirModalNuevo = () => {
        setFormData({ codigo_postal: '', localidad: '', costo_envio: '', activo: true });
        setEditandoId(null);
        setModalAbierto(true);
    };

    const abrirModalEditar = (punto) => {
        setFormData({
            codigo_postal: punto.codigo_postal,
            localidad: punto.localidad,
            costo_envio: punto.costo_envio,
            activo: punto.activo
        });
        setEditandoId(punto.id);
        setModalAbierto(true);
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        const url = editandoId 
            ? `${import.meta.env.VITE_API_URL}/api/tarifas-locales/${editandoId}/` 
            : `${import.meta.env.VITE_API_URL}/api/tarifas-locales/`;
        const method = editandoId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setModalAbierto(false);
                fetchPuntos();
            } else {
                const errorData = await response.json();
                alert(`Error al guardar: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error("Error en la petición:", error);
        }
    };

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar este punto de entrega?")) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tarifas-locales/${id}/`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchPuntos();
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
        }
    };

    if (loading) {
        return (
            <div>
                <Header title="Puntos de Entrega" subtitle="Gestioná las tarifas de tus comisionistas" />
                <Card><div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '0.95rem' }}>Cargando localidades...</div></Card>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            
            {/* 👇 ESTILOS RESPONSIVE PARA QUE NO SE ROMPA EN CELULARES 👇 */}
            <style>
                {`
                .puntos-table { width: 100%; border-collapse: collapse; text-align: left; font-family: 'DM Sans', sans-serif; }
                .puntos-table th { padding: 16px 20px; font-weight: 700; border-bottom: 2px solid #f1f5f9; color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; }
                .puntos-table td { padding: 16px 20px; border-bottom: 1px solid #f8fafc; color: #334155; }
                .puntos-table tbody tr:hover { background-color: #f8fafc; }
                
                /* Magia para celulares: Convertimos la tabla en tarjetas */
                @media (max-width: 768px) {
                    .puntos-table thead { display: none; }
                    .puntos-table, .puntos-table tbody, .puntos-table tr, .puntos-table td { display: block; width: 100%; box-sizing: border-box; }
                    .puntos-table tr { margin-bottom: 15px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                    .puntos-table td { display: flex; justify-content: space-between; align-items: center; text-align: right; padding: 12px 15px; border-bottom: 1px solid #f1f5f9; }
                    .puntos-table td:last-child { border-bottom: none; justify-content: flex-end; background-color: #f8fafc; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
                    .puntos-table td::before { content: attr(data-label); font-weight: 700; color: #64748b; font-size: 0.75rem; text-transform: uppercase; margin-right: 15px; }
                }
                `}
            </style>

            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
                <Header title="Puntos de Entrega" subtitle="Tarifas de comisionistas locales" />
                <button 
                    onClick={abrirModalNuevo}
                    style={{ 
                        backgroundColor: '#0f172a', color: 'white', padding: '10px 18px', 
                        borderRadius: '8px', border: 'none', cursor: 'pointer', 
                        fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        transition: 'transform 0.1s ease, backgroundColor 0.2s ease'
                    }}
                >
                    + Nuevo Punto
                </button>
            </div>

            <Card>
                {puntos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🗺️</div>
                        <p style={{ margin: 0, fontWeight: 500 }}>No hay puntos configurados todavía.</p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem' }}>Agregá localidades para habilitar envíos locales.</p>
                    </div>
                ) : (
                    <table className="puntos-table">
                        <thead>
                            <tr>
                                <th>Cód. Postal</th>
                                <th>Localidad</th>
                                <th>Costo</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {puntos.map(punto => (
                                <tr key={punto.id}>
                                    <td data-label="Cód. Postal" style={{ fontWeight: 600, color: '#0f172a' }}>{punto.codigo_postal}</td>
                                    <td data-label="Localidad">{punto.localidad}</td>
                                    <td data-label="Costo" style={{ fontWeight: 500, color: '#0f172a' }}>${Number(punto.costo_envio).toLocaleString('es-AR')}</td>
                                    <td data-label="Estado">
                                        <span style={{ 
                                            padding: '6px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                                            backgroundColor: punto.activo ? '#dcfce7' : '#f1f5f9',
                                            color: punto.activo ? '#15803d' : '#64748b'
                                        }}>
                                            {punto.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td data-label="Acciones">
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={() => abrirModalEditar(punto)} 
                                                style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                onClick={() => handleEliminar(punto.id)} 
                                                style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                Borrar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>

            {/* MODAL DE EDICIÓN */}
            {modalAbierto && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}>
                    <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>
                            {editandoId ? 'Editar Punto' : 'Nuevo Punto de Entrega'}
                        </h3>
                        
                        <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Código Postal</label>
                                <input type="text" name="codigo_postal" placeholder="Ej. 2347" value={formData.codigo_postal} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Localidad</label>
                                <input type="text" name="localidad" placeholder="Ej. San Guillermo" value={formData.localidad} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Costo de Envío ($)</label>
                                <input type="number" step="0.01" name="costo_envio" placeholder="0.00" value={formData.costo_envio} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                                <input type="checkbox" name="activo" checked={formData.activo} onChange={handleInputChange} id="check-activo" style={{ width: '18px', height: '18px', accentColor: '#0f172a', cursor: 'pointer' }} />
                                <label htmlFor="check-activo" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#334155' }}>Habilitar destino para clientes</label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                                <button type="button" onClick={() => setModalAbierto(false)} style={{ padding: '10px 18px', backgroundColor: 'transparent', color: '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                                <button type="submit" style={{ padding: '10px 24px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VistaPuntosEntrega;