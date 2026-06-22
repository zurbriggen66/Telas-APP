import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, ShoppingBag, Users, Calendar, Store, Globe, ChevronDown, Receipt, Eye, Smartphone, Monitor } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import './Estadisticas.css';

const EstadisticasDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [mesConsulta, setMesConsulta] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // ✅ CORRECCIÓN 1: Estado dedicado para usuarios en tiempo real
    const [usuariosEnLinea, setUsuariosEnLinea] = useState(0);

    const chartWrapperRef = useRef(null);

    // Carga inicial de estadísticas
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/estadisticas/`);
                if (!response.ok) throw new Error('Error en red');
                const data = await response.json();
                setStats(data);
                setMesConsulta(data.mes_actual.id_mes);
                // Tomamos el valor inicial de tiempo real que ya viene en el response
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

    // ✅ CORRECCIÓN 2: Polling independiente al endpoint /realtime/ cada 30 segundos
    useEffect(() => {
        const fetchRealtime = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/estadisticas/realtime/`);
                if (!res.ok) return;
                const data = await res.json();
                setUsuariosEnLinea(data.usuarios_tiempo_real || 0);
            } catch (e) {
                // Silenciamos el error para no interrumpir la UI
                console.error("Error realtime GA4:", e);
            }
        };

        // Primera llamada inmediata, luego cada 30 segundos
        fetchRealtime();
        const intervalo = setInterval(fetchRealtime, 30000);

        // Limpieza al desmontar el componente
        return () => clearInterval(intervalo);
    }, []);

    // Auto-scroll del gráfico al cargar
    useEffect(() => {
        if (stats && chartWrapperRef.current) {
            setTimeout(() => {
                chartWrapperRef.current.scrollLeft = chartWrapperRef.current.scrollWidth;
            }, 150);
        }
    }, [stats]);

    if (loading) return <div className="loading-spinner">Cargando métricas...</div>;
    if (error || !stats) return <div className="error-banner">Error al cargar las estadísticas.</div>;

    // ─── LÓGICA DE DATOS MENSUALES ───
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

    const PIE_COLORS = ['#f59e0b', '#4f46e5', '#10b981'];
    const DEVICE_COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6'];

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

                {/* Ventas del mes seleccionado */}
                <div className="metric-card highlight-card">
                    <div className="metric-header">
                        <h3>Ventas de {datosMesSeleccionado.mes_label}</h3>
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
                        <h3>Ticket Promedio ({datosMesSeleccionado.mes_label})</h3>
                        <div className="metric-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                            <Receipt size={20} />
                        </div>
                    </div>
                    <h2 className="metric-value">${Math.round(ticketPromedio).toLocaleString('es-AR')}</h2>
                </div>

                {/* Visitantes únicos */}
                <div className="metric-card">
                    <div className="metric-header">
                        <h3>Visitantes Únicos (30d)</h3>
                        <div className="metric-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                            <Users size={20} />
                        </div>
                    </div>
                    <h2 className="metric-value">{analytics.visitas_30_dias}</h2>
                </div>

                {/* Vistas de catálogo */}
                <div className="metric-card">
                    <div className="metric-header">
                        <h3>Vistas de Catálogo (30d)</h3>
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
                        <h3>Ingresos Históricos</h3>
                        <div className="metric-icon" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <h2 className="metric-value">${(stats.ingresos_totales).toLocaleString('es-AR')}</h2>
                </div>

                {/* ✅ CORRECCIÓN 3: Tarjeta "En Línea Ahora" dentro del metrics-grid,
                    usando el estado 'usuariosEnLinea' que se actualiza por polling */}
                <div className="metric-card">
                    <div className="metric-header">
                        <h3>En Línea Ahora</h3>
                        <div className="metric-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
                            <span style={{
                                fontSize: '12px',
                                animation: 'pulse 1.5s ease-in-out infinite'
                            }}>●</span>
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

            {/* Gráficos de torta: origen de ventas y dispositivos */}
            <div className="charts-grid secondary-charts" style={{ marginTop: '24px', gridTemplateColumns: '1fr 1fr' }}>

                {/* Origen de ventas del mes */}
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

                {/* Dispositivos de tráfico GA4 */}
                <div className="content-section">
                    <h2 className="section-title">Dispositivos de Tráfico (GA4)</h2>
                    {analytics.dispositivos && analytics.dispositivos.length > 0 ? (
                        <>
                            <div style={{ width: '100%', height: 260 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={analytics.dispositivos}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {analytics.dispositivos.map((entry, index) => (
                                                <Cell key={`cell-dev-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => [`${value} Usuarios`, 'Tráfico']}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="pie-legend-details">
                                {analytics.dispositivos.find(d => d.name === "Celular") && (
                                    <div className="legend-item">
                                        <Smartphone size={16} color={DEVICE_COLORS[0]} /> Celular
                                    </div>
                                )}
                                {analytics.dispositivos.find(d => d.name === "PC") && (
                                    <div className="legend-item">
                                        <Monitor size={16} color={DEVICE_COLORS[1]} /> PC
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="no-data-pie" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>
                            Recopilando datos de Google Analytics...
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default EstadisticasDashboard;