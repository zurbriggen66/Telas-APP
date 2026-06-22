import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, ShoppingBag, Users, Calendar, Store, Globe, ChevronDown, Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import './Estadisticas.css';

const EstadisticasDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [mesConsulta, setMesConsulta] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
    
    // 👇 REF PARA CONTROLAR EL SCROLL DEL GRÁFICO
    const chartWrapperRef = useRef(null); 

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/estadisticas/`);
                if (!response.ok) throw new Error('Error en red');
                const data = await response.json();
                setStats(data);
                setMesConsulta(data.mes_actual.id_mes);
            } catch (error) {
                console.error("Error:", error);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // 👇 EFECTO MAGICO: Scrollea el gráfico al final (mes actual) cuando termina de cargar
    useEffect(() => {
        if (stats && chartWrapperRef.current) {
            setTimeout(() => {
                chartWrapperRef.current.scrollLeft = chartWrapperRef.current.scrollWidth;
            }, 150); // Le damos 150ms para que Recharts termine de dibujar las barras
        }
    }, [stats]);

    if (loading) return <div className="loading-spinner">Cargando métricas...</div>;
    if (error || !stats) return <div className="error-banner">Error al cargar las estadísticas.</div>;

    // ─── LÓGICA DE DATOS MENSUALES ───
    const datosMesSeleccionado = stats.historial_12_meses.find(m => m.id_mes === mesConsulta) || stats.mes_actual;
    
    // Calcular Ticket Promedio
    const ticketPromedio = datosMesSeleccionado.ventas > 0 
        ? datosMesSeleccionado.ingresos / datosMesSeleccionado.ventas 
        : 0;

    // Calcular Origen de Ventas para el MES seleccionado
    const ventasDelMes = datosMesSeleccionado.ventas || 0;
    const totalHistorico = stats.origen_ventas.reduce((acc, curr) => acc + curr.value, 0) || 1;
    const porcentajeLocal = stats.origen_ventas[0].value / totalHistorico;
    
    const ventasLocalMes = Math.round(ventasDelMes * porcentajeLocal);
    const ventasWebMes = ventasDelMes - ventasLocalMes;
    
    const origenVentasMes = [
        { name: 'Local', value: ventasLocalMes },
        { name: 'Web', value: ventasWebMes }
    ];

    const PIE_COLORS = ['#f59e0b', '#4f46e5'];

    return (
        <div className="stats-page-container">
            <div className="stats-header">
                <h1>Panel de Rendimiento</h1>
            </div>

            {/* Fila 1: Tarjetas Principales */}
            <div className="metrics-grid">
                
                {/* SELECTOR SOFISTICADO CON ORDEN INVERTIDO */}
                <div className="metric-card interactive" style={{ zIndex: 10 }}>
                    <div className="metric-header">
                        <h3>Consultar Mes</h3>
                        <div className="metric-icon" style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}><Calendar size={20} /></div>
                    </div>
                    <div 
                        className="custom-select-container" 
                        tabIndex={0} 
                        onBlur={() => setIsDropdownOpen(false)}
                    >
                        <div className="custom-select-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                            {datosMesSeleccionado.mes_label} 
                            <ChevronDown size={18} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.3s' }}/>
                        </div>
                        {isDropdownOpen && (
                            <div className="custom-select-dropdown">
                                {/* 👇 ACÁ CLONAMOS EL ARRAY Y LO INVERTIMOS (reverse) 👇 */}
                                {[...stats.historial_12_meses].reverse().map((mes) => (
                                    <div 
                                        key={mes.id_mes} 
                                        className={`custom-select-option ${mesConsulta === mes.id_mes ? 'selected' : ''}`}
                                        onMouseDown={() => {
                                            setMesConsulta(mes.id_mes);
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        {mes.mes_label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="metric-card highlight-card">
                    <div className="metric-header">
                        <h3>Ventas de {datosMesSeleccionado.mes_label}</h3>
                        <div className="metric-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}><ShoppingBag size={20} /></div>
                    </div>
                    <h2 className="metric-value text-white">{datosMesSeleccionado.ventas} <span className="sub-value">cerradas</span></h2>
                    <p className="text-white-muted">Ingresos: ${(datosMesSeleccionado.ingresos).toLocaleString('es-AR')}</p>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <h3>Ticket Promedio ({datosMesSeleccionado.mes_label})</h3>
                        <div className="metric-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}><Receipt size={20} /></div>
                    </div>
                    <h2 className="metric-value">${Math.round(ticketPromedio).toLocaleString('es-AR')}</h2>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <h3>Ingresos Históricos</h3>
                        <div className="metric-icon" style={{ backgroundColor: '#d1fae5', color: '#059669' }}><DollarSign size={20} /></div>
                    </div>
                    <h2 className="metric-value">${(stats.ingresos_totales).toLocaleString('es-AR')}</h2>
                </div>

            </div>

            {/* Fila 2: Gráficos */}
            <div className="charts-grid">
                
                <div className="content-section">
                    <h2 className="section-title">Evolución Anual (Ingresos)</h2>
                    {/* 👇 LE ASIGNAMOS LA REF AL CONTENEDOR PARA PODER MOVERLO 👇 */}
                    <div className="chart-wrapper" ref={chartWrapperRef}>
                        <div className="chart-scroll-area">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.historial_12_meses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="mes_label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis tickFormatter={(val) => `$${val/1000}k`} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={60} />
                                    <Tooltip formatter={(value) => [`$${value.toLocaleString('es-AR')}`, 'Ingresos']} cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="ingresos" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="content-section">
                    <h2 className="section-title">Origen de Ventas ({datosMesSeleccionado.mes_label})</h2>
                    {ventasDelMes > 0 ? (
                        <>
                            <div style={{ width: '100%', height: 260 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={origenVentasMes}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {origenVentasMes.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [`${value} Ventas`, 'Cantidad']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="pie-legend-details">
                                <div className="legend-item"><Store size={16} color="#f59e0b" /> Local: {origenVentasMes[0].value}</div>
                                <div className="legend-item"><Globe size={16} color="#4f46e5" /> Web: {origenVentasMes[1].value}</div>
                            </div>
                        </>
                    ) : (
                        <div className="no-data-pie">No hubo ventas registradas en este mes.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EstadisticasDashboard;