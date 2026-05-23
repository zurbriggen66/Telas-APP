import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Importá tus componentes de UI acá (ajustá la ruta si es necesario)
import Header from '../../components/Header';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import CheckItem from '../../components/CheckItem';

const API = import.meta.env.VITE_API_URL + '/api';

const VistaInicio = () => {
  const [stats, setStats] = useState({ productos: 0, pedidos: 0, ventas: 0 });
  const navigate = useNavigate(); // Reemplaza la vieja función setActive

  useEffect(() => {
    axios.get(`${API}/productos/`).then(res => {
      const productos = Array.isArray(res.data) ? res.data.length : (res.data.count || 0);
      setStats(prev => ({ ...prev, productos }));
    }).catch(() => {});
  }, []);

  return (
    <div>
      <Header title="Inicio" subtitle="¡Chequeá los pasos para dejar tu tienda a tu manera!" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Productos cargados" value={stats.productos} color="#6366f1" />
        <StatCard label="Pedidos del mes"    value={stats.pedidos}   color="#f59e0b" />
        <StatCard label="Ventas totales"     value={`$${stats.ventas}`} color="#10b981" />
      </div>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Tareas para empezar</span>
        </div>
        <CheckItem done label="Crear tienda" desc="¡Tu tienda está publicada!" icon="home" />
        <CheckItem label="Agregar productos" desc="Cargá tu catálogo de productos con precio y talle" icon="products" onClick={() => navigate('/dashboard/productos')} />
        <CheckItem label="Crear categorías" desc="Organizá tus productos por categoría" icon="category" onClick={() => navigate('/dashboard/categorias')} />
        <CheckItem label="Personalizar diseño" desc="Cambiá el banner principal de tu tienda" icon="design" onClick={() => navigate('/dashboard/diseno')} />
        <CheckItem label="Gestionar ventas y pedidos" desc="Revisá y administrá tus órdenes" icon="orders" onClick={() => navigate('/dashboard/pedidos')} />
      </Card>
    </div>
  );
};

export default VistaInicio;