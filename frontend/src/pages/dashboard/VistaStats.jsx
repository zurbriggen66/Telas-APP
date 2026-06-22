import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, ShoppingBag, Users, Calendar, Store, Globe, ChevronDown, Receipt, Eye, HelpCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import './Estadisticas.css';

// ─── COMPONENTE TOOLTIP DE AYUDA ───
const InfoTooltip = ({ texto }) => {
    const [visible, setVisible] = useState(false);

    return (
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <button
                onClick={() => setVisible(!visible)}
                onMouseEnter={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#94a3b8',
                }}
                title={texto}
            >
                <HelpCircle size={15} />
            </button>
            {visible && (
                <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#1e293b',
                    color: '#f1f5f9',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 500,
                    lineHeight: '1.5',
                    width: '200px',
                    textAlign: 'center',
                    zIndex: 999,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    pointerEvents: 'none',
                }}>
                    {texto}
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid #1e293b',
                    }} />
                </div>
            )}
        </div>
    );
};

const EstadisticasDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [mesConsulta, setMesConsulta] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [usuariosEnLinea, setUsuariosEnLinea] = useState(0);

    const chartWrapperRef = useRef(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/estadisticas/`);
                if (!response.ok) throw new Error('Error en red');
                const data = await response.json();
                setStats(data);
                setMesConsulta(data.mes_actual.id_mes);
                setUsuariosEnLinea(data.analytics?.usuarios_tiempo_real || 0);
            } catch (error) {
                console.error("Error:", error);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        const fetchRealtime = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/estadisticas/realtime/`);
                if (!res.ok) return;
                const data = await res.json();
                setUsuariosEnLinea(data.usuarios_tiempo_real || 0);
            } catch (e) {
                console.error("Error realtime GA4:", e);
            }
        };
        fetchRealtime();
        const intervalo = setInterval(fetchRealtime, 30000);
        return () => clearInterval(intervalo);
    }, []);

    useEffect(() => {
        if (stats && chartWrapperRef.current) {
            setTimeout(() => {
                chartWrapperRef.current.scrollLeft = chartWrapperRef.current.scrollWidth;
            }, 150);
        }
    }, [stats]);

    if (loading) return <div className="loading-spinner">Cargando métricas...</div>;
    if (error || !stats) return <div className="error-banner">Error al cargar las estadísticas.</div>;

    const datosMesSeleccionado = stats.historial_12_meses.find(m => m.id_mes === mesConsulta) || stats.mes_actual;

    const ticketPromedio = datosMesSeleccionado.ventas > 0
        ? datosMesSeleccionado.ingresos / datosMesSeleccionado.ventas
        : 0;

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
    const analytics = stats.analytics || { visitas_30_dias: 0, vistas_pagina: 0, dispositivos: [] };

    return (
        <div className="stats-page-container">
            <div className="stats-header">
                <h1>Panel de Rendimiento</h1>
            </div>

            <div className="metrics-grid">

                {/* Selector de mes */}
                <div className="metric-card interactive" style={{ zIndex: 10 }}>
                    <div className="metric-header">
                        <h3>Consultar Mes</h3>
                        <div className="metric-icon" style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}>
                            <Calendar size={20} />
                        </div>
                    </div>
                    <div
                        className="custom-select-container"
                        tabIndex={0}
                        onBlur={() => setIsDropdownOpen(false)}
                    >
                        <div className="custom-select-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                            {datosMesSeleccionado.mes_label}
                            <ChevronDown size={18} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.3s' }} />
                        </div>
                        {isDropdownOpen && (
                            <div className="custom-select-dropdown">
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

                {/* Ventas del mes */}
                <div className="metric-card highlight-card">
                    <div className="metric-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h3>Ventas de {datosMesSeleccionado.mes_label}</h3>
                            <InfoTooltip texto="Pedidos cobrados y confirmados en el mes seleccionado, tanto por web como en el local físico." />
                        </div>
                        <div className="metric-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                            <ShoppingBag size={20} />
                        </div>
                    </div>
                    <h2 className="metric-value text-white">
                        {datosMesSeleccionado.ventas} <span className="sub-value">cerradas</span>
                    </h2>
                    <p className="text-white-muted">
                        Ingresos: ${(datosMesSeleccionado.ingresos).toLocaleString('es-AR')}
                    </p>
                </div>

                {/* Ticket promedio */}
                <div className="metric-card">
                    <div className="metric-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h3>Ticket Promedio ({datosMesSeleccionado.mes_label})</h3>
                            <InfoTooltip texto="Gasto promedio por venta en el mes. Se calcula dividiendo los ingresos totales por la cantidad de ventas cerradas." />
                        </div>
                        <div className="metric-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                            <Receipt size={20} />
                        </div>
                    </div>
                    <h2 className="metric-value">${Math.round(ticketPromedio).toLocaleString('es-AR')}</h2>
                </div>

                {/* Visitantes únicos */}
                <div className="metric-card">
                    <div className="metric-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h3>Visitantes Únicos (30d)</h3>
                            <InfoTooltip texto="Personas distintas que entraron a tu tienda online en los últimos 30 días según Google Analytics. Un usuario que vuelve varias veces cuenta solo una vez." />
                        </div>
                        <div className="metric-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                            <Users size={20} />
                        </div>
                    </div>
                    <h2 className="metric-value">{analytics.visitas_30_dias}</h2>
                </div>

                {/* Vistas de catálogo */}
                <div className="metric-card">
                    <div className="metric-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h3>Vistas de Catálogo (30d)</h3>
                            <InfoTooltip texto="Total de páginas vistas en tu tienda en los últimos 30 días. Si un cliente navega 5 productos, suma 5. Refleja qué tan explorado es tu catálogo." />
                        </div>
                        <div className="metric-icon" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                            <Eye size={20} />
                        </div>
                    </div>
                    <h2 className="metric-value">{analytics.vistas_pagina}</h2>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                        Promedio: {analytics.visitas_30_dias > 0
                            ? (analytics.vistas_pagina / analytics.visitas_30_dias).toFixed(1)
                            : 0} pág/usuario
                    </p>
                </div>

                {/* Ingresos históricos */}
                <div className="metric-card">
                    <div className="metric-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h3>Ingresos Históricos</h3>
                            <InfoTooltip texto="Suma de todas las ventas aprobadas desde que empezaste a usar la app, sin filtro de fecha. Es el total acumulado." />
                        </div>
                        <div className="metric-icon" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <h2 className="metric-value">${(stats.ingresos_totales).toLocaleString('es-AR')}</h2>
                </div>

                {/* En línea ahora */}
                <div className="metric-card">
                    <div className="metric-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h3>En Línea Ahora</h3>
                            <InfoTooltip texto="Clientes navegando tu tienda online en este momento, según Google Analytics en tiempo real. Se refresca automáticamente cada 30 segundos." />
                        </div>
                        <div className="metric-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
                            <span style={{ fontSize: '12px', animation: 'pulse 1.5s ease-in-out infinite' }}>●</span>
                        </div>
                    </div>
                    <h2 className="metric-value">{usuariosEnLinea}</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px' }}>
                        Actualiza cada 30 seg
                    </p>
                </div>

            </div>

            {/* Gráfico de evolución anual */}
            <div className="charts-grid">
                <div className="content-section">
                    <h2 className="section-title">Evolución Anual (Ingresos)</h2>
                    <div className="chart-wrapper" ref={chartWrapperRef}>
                        <div className="chart-scroll-area">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats.historial_12_meses}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="mes_label"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                    />
                                    <YAxis
                                        tickFormatter={(val) => `$${val / 1000}k`}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        width={60}
                                    />
                                    <Tooltip
                                        formatter={(value) => [`$${value.toLocaleString('es-AR')}`, 'Ingresos']}
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="ingresos" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Solo gráfico de Origen de Ventas — dispositivos eliminado */}
            <div style={{ marginTop: '24px' }}>
                <div className="content-section" style={{ maxWidth: '600px' }}>
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
                                        <Tooltip
                                            formatter={(value) => [`${value} Ventas`, 'Cantidad']}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="pie-legend-details">
                                <div className="legend-item">
                                    <Store size={16} color="#f59e0b" /> Local: {origenVentasMes[0].value}
                                </div>
                                <div className="legend-item">
                                    <Globe size={16} color="#4f46e5" /> Web: {origenVentasMes[1].value}
                                </div>
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