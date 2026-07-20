import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Store, Search, Trash2, History, ShoppingBag, CheckCircle2, X } from 'lucide-react';
import './VentasLocal.css'; 

const VentasLocal = () => {
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState(''); // valor usado para filtrar (debounced)
    const [searchTerm, setSearchTerm] = useState(''); // valor inmediato del input
    const [cargando, setCargando] = useState(true);
    
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [metros, setMetros] = useState('');
    const [precioCobrado, setPrecioCobrado] = useState('');
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
    
    const [historialVentas, setHistorialVentas] = useState([]);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL}/api/productos/`)
            .then((res) => {
                let dataExtraida = [];
                if (Array.isArray(res.data)) dataExtraida = res.data; 
                else if (res.data?.results) dataExtraida = res.data.results; 
                else if (res.data?.data) dataExtraida = res.data.data; 
                setProductos(dataExtraida);
                setCargando(false);
            })
            .catch(err => {
                console.error("Error cargando telas:", err);
                setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor.' });
                setCargando(false);
            });
    }, []);

    // Debounce simple: actualiza `busqueda` 200ms después de que el usuario deje de tipear
    useEffect(() => {
        const id = setTimeout(() => setBusqueda(searchTerm), 200);
        return () => clearTimeout(id);
    }, [searchTerm]);

    // Memoiza el filtrado para evitar recalcularlo en cada render innecesario
    const productosFiltrados = useMemo(() => {
        const q = (busqueda || '').toLowerCase();
        if (!q) return productos;
        return productos.filter(p => {
            const nombreTela = p.nombre || p.name || p.title || ''; 
            return nombreTela.toLowerCase().includes(q);
        });
    }, [productos, busqueda]);

    // Función para remover la selección si te equivocaste de tela
    const cancelarSeleccion = () => {
        setProductoSeleccionado(null);
        setMetros('');
        setPrecioCobrado('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!productoSeleccionado || !metros || !precioCobrado) {
            setMensaje({ tipo: 'error', texto: 'Completá los metros y el monto.' });
            return;
        }

        const payload = {
            producto_id: parseInt(productoSeleccionado.id),
            metros: parseFloat(metros),
            precio_cobrado: parseFloat(precioCobrado)
        };

        try {
           const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/pedido/venta-local/`, payload);
            
            setMensaje({ tipo: 'success', texto: '¡Venta registrada con éxito!' });
            
            setProductos(productos.map(p => 
                p.id === productoSeleccionado.id 
                    ? { ...p, stock_metros: res.data.nuevo_stock } 
                    : p
            ));
            
            const nuevaVenta = {
                id_local: Date.now(),
                tela: productoSeleccionado.nombre || productoSeleccionado.name,
                metros: parseFloat(metros),
                total: parseFloat(precioCobrado),
                hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            setHistorialVentas(prev => [nuevaVenta, ...prev].slice(0, 5));

            cancelarSeleccion();
            setBusqueda('');
            setSearchTerm('');
            
            setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
        } catch (err) {
            setMensaje({ 
                tipo: 'error', 
                texto: err.response?.data?.error || 'Error al procesar la venta.' 
            });
        }
    };

    const removerVentaHistorial = (id_local) => {
        setHistorialVentas(prev => prev.filter(v => v.id_local !== id_local));
    };

    return (
        <div className="ventas-container">
            <div className="ventas-header-section">
                <div className="ventas-header-icon">
                    <Store size={32} color="#4f46e5" />
                </div>
                <div>
                    <h1 className="ventas-title">Punto de Venta Local</h1>
                    <p className="ventas-subtitle">Registrá los movimientos de tu negocio en mostrador. El stock se descontará automáticamente de tu inventario web.</p>
                </div>
            </div>

            <div className="ventas-grid">
                <div className="ventas-card">
                    <h3 className="ventas-card-title"><Search size={18}/> Buscar Producto</h3>
                    
                    <input 
                        type="text" 
                        className="input-moderno"
                        placeholder="Ej: Suete Roja, Gamuza..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <div className="lista-productos">
                        {cargando ? (
                            <div className="loading-spinner">Cargando catálogo...</div>
                        ) : productosFiltrados.length > 0 ? (
                            productosFiltrados.map(p => (
                                <div 
                                    key={p.id} 
                                    className={`producto-item ${productoSeleccionado?.id === p.id ? 'active' : ''}`}
                                    onClick={() => setProductoSeleccionado(p)}
                                >
                                    <div className="producto-item-left">
                                        <img loading="lazy" src={p.imagen || 'https://via.placeholder.com/60'} alt="tela" className="producto-thumb"/>
                                        <div className="producto-info">
                                            <span className="nombre">{p.nombre || p.name || 'Tela'}</span>
                                            <span className="precio">${p.precio_por_metro || 0} /m</span>
                                        </div>
                                    </div>
                                    <div className="producto-item-right">
                                        <span className="stock-label">Stock</span>
                                        <span className={`producto-stock ${(p.stock_metros || 0) <= 5 ? 'bajo' : ''}`}>
                                            {p.stock_metros || 0}m
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <Search size={40} color="#cbd5e1" />
                                <p>No hay resultados para "{busqueda}"</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="ventas-card caja-card">
                    <h3 className="ventas-card-title"><ShoppingBag size={18}/> Cobro en Mostrador</h3>
                    
                    {mensaje.texto && (
                        <div className={`alert ${mensaje.tipo === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '20px' }}>
                            {mensaje.tipo === 'success' ? <CheckCircle2 size={20}/> : '⚠️'} 
                            {mensaje.texto}
                        </div>
                    )}
                    
                    {productoSeleccionado ? (
                        <form onSubmit={handleSubmit} className="form-caja">
                            <div className="ticket-producto">
                                <div className="ticket-detalle-container">
                                    <img loading="lazy" src={productoSeleccionado.imagen || 'https://via.placeholder.com/80'} alt="tela" className="ticket-img"/>
                                    <div className="ticket-info">
                                        <span className="ticket-label">TELA SELECCIONADA</span>
                                        <span className="ticket-title">{productoSeleccionado.nombre || productoSeleccionado.name}</span>
                                        <span className="ticket-precio">Base: ${productoSeleccionado.precio_por_metro}/m</span>
                                    </div>
                                </div>
                                <button type="button" onClick={cancelarSeleccion} className="btn-cancelar-seleccion" title="Remover tela seleccionada">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                            
                            <div className="input-group">
                                <label className="form-label">Metros a cortar</label>
                                <div className="input-wrapper">
                                    <input 
                                        type="number" step="0.01" 
                                        className="input-caja con-sufijo"
                                        value={metros}
                                        onChange={(e) => {
                                            const cant = e.target.value;
                                            setMetros(cant);
                                            const precioBase = productoSeleccionado.precio_por_metro || 0;
                                            if (cant && precioBase) setPrecioCobrado((cant * precioBase).toFixed(2));
                                            else setPrecioCobrado('');
                                        }}
                                        placeholder="0.00" required
                                    />
                                    <span className="input-suffix">mts</span>
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="form-label">Total a cobrar</label>
                                <div className="input-wrapper">
                                    <span className="input-prefix">$</span>
                                    <input 
                                        type="number" step="0.01" 
                                        className="input-caja cobro-final con-prefijo"
                                        value={precioCobrado}
                                        onChange={(e) => setPrecioCobrado(e.target.value)}
                                        placeholder="0.00" required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-submit">
                                Confirmar Venta
                            </button>
                        </form>
                    ) : (
                        <div className="empty-state">
                            <Store size={48} color="#e2e8f0" style={{marginBottom: '10px'}}/>
                            <p>Seleccioná una tela del inventario para abrir la caja.</p>
                        </div>
                    )}
                </div>
            </div>

            {historialVentas.length > 0 && (
                <div className="historial-section fade-in">
                    <h3 className="historial-title"><History size={18}/> Últimas ventas de la sesión</h3>
                    <div className="table-responsive">
                        <table className="historial-table">
                            <thead>
                                <tr>
                                    <th>Hora</th>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Ingreso</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historialVentas.map((venta) => (
                                    <tr key={venta.id_local}>
                                        <td className="hora-col">{venta.hora}</td>
                                        <td className="producto-col">{venta.tela}</td>
                                        <td>{venta.metros} mts</td>
                                        <td className="precio-col">${venta.total.toLocaleString('es-AR')}</td>
                                        <td>
                                            <button 
                                                onClick={() => removerVentaHistorial(venta.id_local)}
                                                className="btn-remover"
                                                title="Remover de la vista"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VentasLocal;