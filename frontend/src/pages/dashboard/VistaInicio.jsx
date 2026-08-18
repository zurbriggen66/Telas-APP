import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, ShoppingCart, DollarSign, Image as ImageIcon, Store, Truck, CreditCard, PlusCircle } from 'lucide-react';
import './DashboardInicio.css'; 

const API = import.meta.env.VITE_API_URL + '/api';

const VistaInicio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [estaVinculadoMp, setEstaVinculadoMp] = useState(false);
  
  const [data, setData] = useState({
    stats: { productos: 0, pedidos_pendientes: 0, ventas_totales: 0 },
    grafico: [],
    a_despachar: [],
    stock_bajo: []
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    // 1. Si viene de vincular, mostramos la alerta
    if (searchParams.get('success') === 'mp_vinculado') {
      alert('¡Felicidades! Tus cobros ahora se procesarán con Mercado Pago.');
      
      // Limpiamos la URL para que la alerta no vuelva a salir si apretamos F5
      window.history.replaceState(null, '', window.location.pathname);
    }

    // 2. Pedimos los datos al backend
    axios.get(`${API}/dashboard/inicio/`)
      .then(res => {
        setData(res.data);
        
        // 3. Leemos el estado real desde la base de datos
        if (res.data.mp_conectado) {
          setEstaVinculadoMp(true);
        }
      })
      .catch(err => console.error("Error cargando dashboard:", err));
  }, [location.search]);

  return (
    <div className="dashboard-container">
      
      {/* 1. TARJETAS SUPERIORES */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
            <Package size={24} />
          </div>
          <div className="stat-info">
            <h4>{data.stats.productos}</h4>
            <p>Productos cargados</p>
          </div>
        </div>

        {/* 👇 NUEVA TARJETA AZUL DE ACCESO RÁPIDO 👇 */}
        <div className="stat-card action-banner-blue" onClick={() => navigate('/dashboard/productos')}>
          <div className="stat-icon" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }}>
            <PlusCircle size={28} />
          </div>
          <div className="stat-info">
            <h4>Registrá tus telas</h4>
            <p>Hacé clic aquí para cargar</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5', color: '#059669' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h4>${data.stats.ventas_totales.toLocaleString('es-AR')}</h4>
            <p>Ingresos del mes</p>
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN MEDIA */}
      <div className="middle-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Ventas de este mes</h3>
          </div>
          {/* 👇 CONTENEDOR DE GRÁFICO MEJORADO PARA MÓVILES 👇 */}
          <div className="chart-wrapper">
            <div className="chart-scroll-area">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.grafico}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `$${value}`} width={65} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(value) => [`$${value}`, 'Ventas']} />
                  <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>A preparar y despachar</h3>
            <span className="ver-todos" onClick={() => navigate('/dashboard/pedidos')}>Ver órdenes</span>
          </div>
          <table className="orders-table">
            <tbody>
              {data.a_despachar.length > 0 ? data.a_despachar.map((pedido, index) => (
                <tr key={index}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{pedido.cliente}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{pedido.envio}</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: '#059669' }}>${pedido.total}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{pedido.fecha}</div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="2" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>No hay envíos pendientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. SECCIÓN INFERIOR */}
      <div className="bottom-grid">
        
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Atención de Stock</h3>
            <span className="ver-todos" onClick={() => navigate('/dashboard/productos')}>Inventario</span>
          </div>
          <div className="item-list">
            {data.stock_bajo.length > 0 ? data.stock_bajo.map((prod) => (
              <div className="item-row" key={prod.id}>
                <div className="item-img"><ImageIcon size={20} /></div>
                <div className="item-details">
                  <h4>{prod.nombre}</h4>
                  <p>${prod.precio} x metro</p>
                </div>
                <span className="badge-danger">{prod.stock}m</span>
              </div>
            )) : (
              <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>Excelente, todo el stock está en orden.</p>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Acciones Rápidas</h3>
          </div>
          <div className="actions-grid">
             <div className="action-box primary" onClick={() => navigate('/dashboard/venta-local')}>
                <Store size={22} />
                <span>Registrar Venta Local</span>
             </div>
             <div className="action-box secondary" onClick={() => navigate('/dashboard/productos')}>
                <Package size={22} />
                <span>Gestionar Catálogo</span>
             </div>
             
             <div className={`action-box ${estaVinculadoMp ? 'success' : 'mp'}`}
                  onClick={() => { if(!estaVinculadoMp) window.confirm("¿Vincular con Mercado Pago?") && (window.location.href = `https://auth.mercadopago.com/authorization?client_id=${import.meta.env.VITE_MP_APP_ID}&response_type=code&platform_id=mp&state=1&redirect_uri=https://www.modaytelas.store/api/mercadopago/callback/`); }}>
                <CreditCard size={22} />
                <span>{estaVinculadoMp ? 'MP Vinculado' : 'Cobrar con MP'}</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VistaInicio;