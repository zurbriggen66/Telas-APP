import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Clock, XCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const EstadisticasDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    // Guarda qué tarjeta se hizo clic
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/estadisticas/`);
                if (!response.ok) throw new Error('Respuesta de red no OK');
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error("Error cargando estadísticas", error);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', flexDirection: 'column', gap: '15px' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <h3 style={{ color: '#6b7280', fontFamily: 'sans-serif' }}>Cargando métricas...</h3>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (error || !stats) return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444', backgroundColor: '#fee2e2', borderRadius: '8px', margin: '20px', fontFamily: 'sans-serif' }}>
            <XCircle size={40} style={{ margin: '0 auto', marginBottom: '10px' }} />
            <h2 style={{ margin: 0 }}>Error de conexión</h2>
            <p>No se pudieron cargar las estadísticas. Verificá que el servidor Django esté corriendo.</p>
        </div>
    );

    const cardBaseStyle = {
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease',
        cursor: 'pointer',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    };

    // Función auxiliar para renderizar la lista de la categoría clickeada
    const renderizarDetalle = () => {
        if (!categoriaSeleccionada || !stats.detalles[categoriaSeleccionada]) return null;

        const lista = stats.detalles[categoriaSeleccionada];
        
        const titulos = {
            ingresos: "Detalle de Ingresos",
            exitosos: "Pedidos Exitosos",
            pendientes: "Pedidos Pendientes",
            cancelados: "Pedidos Cancelados"
        };

        return (
            <div style={{ marginTop: '40px', padding: '24px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontFamily: 'system-ui, -apple-system, sans-serif', animation: 'deslizarArriba 0.3s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f3f4f6', paddingBottom: '16px', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: '#1f2937' }}>{titulos[categoriaSeleccionada]}</h2>
                    <button 
                        onClick={() => setCategoriaSeleccionada(null)}
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                    >
                        Cerrar ✕
                    </button>
                </div>
                
                {lista.length === 0 ? (
                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No hay datos para mostrar en esta categoría.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                          <thead>
                              <tr style={{ color: '#6b7280', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  <th style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>Pedido</th>
                                  <th style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>Estado</th>
                                  <th style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>Cliente</th>
                                  <th style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', whiteSpace: 'normal', minWidth: '200px' }}>Detalle de Telas</th>
                                  <th style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>Total & Método</th>
                              </tr>
                          </thead>
                          <tbody>
                              {lista.map((item, index) => {
                                  // Lógica para el color del estado
                                  let bgEstado = '#f3f4f6';
                                  let colorEstado = '#374151';
                                  let textoEstado = (item.estado || '').toUpperCase();
                                  
                                  if (textoEstado.includes('APROBADO') || textoEstado.includes('ENVIADO')) {
                                      bgEstado = '#d1fae5'; colorEstado = '#065f46';
                                  } else if (textoEstado.includes('PENDIENTE') || textoEstado.includes('ESPERANDO')) {
                                      bgEstado = '#fef3c7'; colorEstado = '#92400e';
                                  } else if (textoEstado.includes('CANCELADO')) {
                                      bgEstado = '#fee2e2'; colorEstado = '#991b1b';
                                  }

                                  return (
                                      <tr key={index} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                          
                                          {/* Columna Pedido y Fecha */}
                                          <td style={{ padding: '16px' }}>
                                              <div style={{ color: '#111827', fontWeight: 'bold', fontSize: '1.1rem' }}>#{item.id}</div>
                                              <div style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '2px' }}>{item.fecha}</div>
                                          </td>

                                          {/* Columna Estado */}
                                          <td style={{ padding: '16px' }}>
                                              <span style={{ backgroundColor: bgEstado, color: colorEstado, padding: '6px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                                                  {textoEstado}
                                              </span>
                                          </td>

                                          {/* Columna Cliente (Email y Teléfono) */}
                                          <td style={{ padding: '16px' }}>
                                              <div style={{ color: '#374151', fontWeight: '500', fontSize: '0.95rem' }}>{item.email}</div>
                                              <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '2px' }}>{item.telefono}</div>
                                          </td>

                                          {/* Columna Detalle de Telas */}
                                          <td style={{ padding: '16px', color: '#6b7280', fontSize: '0.9rem', whiteSpace: 'normal', lineHeight: '1.4' }}>
                                              {item.detalle_telas}
                                          </td>

                                          {/* Columna Total y Método de Pago */}
                                          <td style={{ padding: '16px' }}>
                                              <div style={{ color: '#111827', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                  ${parseFloat(item.total || 0).toLocaleString('es-AR')}
                                              </div>
                                              <div style={{ backgroundColor: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', display: 'inline-block', marginTop: '6px', letterSpacing: '0.05em' }}>
                                                  {(item.metodo_pago || 'TRANSFERENCIA').toUpperCase()}
                                              </div>
                                          </td>

                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* Animación global para que tanto la tabla como el gráfico entren suaves */}
            <style>
                {`
                @keyframes deslizarArriba {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                `}
            </style>

            <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <TrendingUp size={32} color="#1f2937" />
                <h1 style={{ margin: 0, color: '#1f2937', fontSize: '2rem', fontWeight: 'bold' }}>Panel de Rendimiento</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                
                {/* 1. Tarjeta Ingresos */}
                <div 
                    onClick={() => setCategoriaSeleccionada('ingresos')}
                    style={{ ...cardBaseStyle, backgroundColor: '#ffffff', borderTop: '4px solid #10b981' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, color: '#6b7280', fontSize: '1.1rem', fontWeight: '500' }}>Ingresos Totales</h3>
                        <div style={{ backgroundColor: '#d1fae5', padding: '8px', borderRadius: '8px' }}>
                            <DollarSign size={24} color="#059669" />
                        </div>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', margin: 0, color: '#111827', fontWeight: 'bold' }}>
                        ${(stats?.ingresos || 0).toLocaleString('es-AR')}
                    </h2>
                </div>

                {/* 2. Tarjeta Ventas Cerradas */}
                <div 
                    onClick={() => setCategoriaSeleccionada('exitosos')}
                    style={{ ...cardBaseStyle, backgroundColor: '#ffffff', borderTop: '4px solid #3b82f6' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, color: '#6b7280', fontSize: '1.1rem', fontWeight: '500' }}>Ventas Cerradas</h3>
                        <div style={{ backgroundColor: '#dbeafe', padding: '8px', borderRadius: '8px' }}>
                            <ShoppingBag size={24} color="#2563eb" />
                        </div>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', margin: 0, color: '#111827', fontWeight: 'bold' }}>
                        {stats?.pedidos?.exitosos || 0}
                    </h2>
                </div>

                {/* 3. Tarjeta Pendientes */}
                <div 
                    onClick={() => setCategoriaSeleccionada('pendientes')}
                    style={{ ...cardBaseStyle, backgroundColor: '#ffffff', borderTop: '4px solid #f59e0b' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, color: '#6b7280', fontSize: '1.1rem', fontWeight: '500' }}>Pendientes</h3>
                        <div style={{ backgroundColor: '#fef3c7', padding: '8px', borderRadius: '8px' }}>
                            <Clock size={24} color="#d97706" />
                        </div>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', margin: 0, color: '#111827', fontWeight: 'bold' }}>
                        {stats?.pedidos?.pendientes || 0}
                    </h2>
                </div>

                {/* 4. Tarjeta Cancelados */}
                <div 
                    onClick={() => setCategoriaSeleccionada('cancelados')}
                    style={{ ...cardBaseStyle, backgroundColor: '#ffffff', borderTop: '4px solid #ef4444' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, color: '#6b7280', fontSize: '1.1rem', fontWeight: '500' }}>Cancelados</h3>
                        <div style={{ backgroundColor: '#fee2e2', padding: '8px', borderRadius: '8px' }}>
                            <XCircle size={24} color="#dc2626" />
                        </div>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', margin: 0, color: '#111827', fontWeight: 'bold' }}>
                        {stats?.pedidos?.cancelados || 0}
                    </h2>
                </div>

            </div>

            {/* SECCIÓN DEL GRÁFICO (Solo se muestra si NO hay categoría seleccionada) */}
            {!categoriaSeleccionada && stats && (
                <div style={{ 
                    marginTop: '40px', 
                    padding: '24px', 
                    backgroundColor: '#ffffff', 
                    borderRadius: '16px', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    animation: 'deslizarArriba 0.3s ease-out'
                }}>
                    <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '1.2rem' }}>
                        Distribución de Pedidos
                    </h2>
                    
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={[
                                    { name: 'Exitosos', cantidad: stats.pedidos.exitosos, color: '#3b82f6' },
                                    { name: 'Pendientes', cantidad: stats.pedidos.pendientes, color: '#f59e0b' },
                                    { name: 'Cancelados', cantidad: stats.pedidos.cancelados, color: '#ef4444' },
                                ]}
                                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                <Tooltip 
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                                    {
                                        [
                                            { color: '#3b82f6' }, // Azul
                                            { color: '#f59e0b' }, // Naranja
                                            { color: '#ef4444' }  // Rojo
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* SECCIÓN DE LA TABLA (Solo se muestra SI HAY una categoría seleccionada) */}
            {renderizarDetalle()}

        </div>
    );
};

export default EstadisticasDashboard;