import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Icon, icons } from '../components/Icons'; 

const Dashboard = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();
  const location = useLocation();

  // --- ESTADOS PARA LOS NOTIFICADORES (BADGES) ---
  const [transferenciasCount, setTransferenciasCount] = useState(0);
  const [pedidosNuevosCount, setPedidosNuevosCount] = useState(0);

  // --- LÓGICA PARA BUSCAR NOTIFICACIONES EN VIVO ---
  useEffect(() => {
    const fetchNotificaciones = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pedidos/`);
        if (response.ok) {
          const data = await response.json();
          
          // Filtramos transferencias pendientes de validación
          const transferencias = data.filter(p => p.estado === 'Esperando_Transferencia').length;
          
          // Filtramos pedidos que ya entraron y hay que armar
          const pedidosNuevos = data.filter(p => p.estado === 'Pagado' || p.estado === 'Pendiente').length;

          setTransferenciasCount(transferencias);
          setPedidosNuevosCount(pedidosNuevos);
        }
      } catch (error) {
        console.error("Error buscando notificaciones:", error);
      }
    };

    fetchNotificaciones(); // Busca al entrar
    const interval = setInterval(fetchNotificaciones, 60000); // Se actualiza solo cada 60 segundos
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => { 
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setMenuAbierto(false); 
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname.includes(path);

  const getLinkStyle = (path) => ({
    display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
    padding: '12px 16px', marginBottom: '6px', borderRadius: '8px',
    border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
    transition: 'all 0.2s', textAlign: 'left',
    backgroundColor: isActive(path) ? '#1e293b' : 'transparent',
    color: isActive(path) ? '#ffffff' : '#94a3b8',
  });

  // --- COMPONENTE MINI PARA LA BURBUJA ROJA ---
  const Badge = ({ count }) => {
    if (count === 0) return null; // Si es 0, no mostramos la burbuja
    return (
      <span style={{
        backgroundColor: '#ef4444', // Rojo estilo notificación
        color: '#ffffff',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '2px 8px',
        borderRadius: '999px',
        marginLeft: 'auto', // Esto lo empuja bien a la derecha del botón
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '20px',
        height: '20px'
      }}>
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  return (
    <div className="dashboard-root" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh', width: '100vw', marginLeft: 'calc(-50vw + 50%)', margin: 0, padding: 0, top: 0, left: 0, background: '#f8fafc', position: 'relative', fontFamily: "'DM Sans', sans-serif" }}>
      
      {/* 🌟 BARRA SUPERIOR MÓVIL CON LOGO Y MENÚ 🌟 */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 40,
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}>
          {/* Botón de menú hamburguesa */}
          <button 
            onClick={() => setMenuAbierto(true)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              padding: '8px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <Icon d={icons.menu} size={24} color="#0f172a" strokeWidth="2" />
            {/* Puntito rojo de notificación */}
            {(transferenciasCount > 0 || pedidosNuevosCount > 0) && (
              <span style={{ width: 10, height: 10, background: '#ef4444', border: '2px solid white', borderRadius: '50%', position: 'absolute', top: 4, right: 4 }} />
            )}
          </button>

          {/* Logo / Nombre  */}
          <div style={{ 
            fontSize: '18px', 
            fontWeight: '800', 
            color: '#0f172a', 
            letterSpacing: '-0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            Tienda<span style={{ color: '#6366f1' }}>IA</span>
          </div>
        </div>
      )}

      {/* OVERLAY OSCURO */}
      {isMobile && menuAbierto && (
        <div onClick={() => setMenuAbierto(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(2px)', zIndex: 45 }} />
      )}

      {/* PANEL LATERAL (SIDEBAR) */}
      <aside style={{
        width: 260, background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column',
        position: isMobile ? 'fixed' : 'sticky',
        top: 0, left: 0, height: '100vh', zIndex: 50, margin: 0, padding: 0, transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isMobile && !menuAbierto ? 'translateX(-100%)' : 'translateX(0)',
        boxShadow: isMobile ? '4px 0 24px rgba(0,0,0,0.2)' : 'none'
      }}>
        {!isMobile && (
          <div style={{ padding: '32px 24px 24px' }}>
             <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>Telas-APP</h2>
             <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>Panel de Control</p>
          </div>
        )}

        {isMobile && (
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 16 }}>
                 <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                     <span style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />
                     <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>Telas-APP</span>
                 </div>
                 <button onClick={() => setMenuAbierto(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}>
                     <Icon d={icons.x} size={20} color="#94a3b8" />
                 </button>
            </div>
        )}
        
        <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', margin: '0 0 8px 16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Inicio</div>
          <button style={getLinkStyle('/dashboard/inicio')} onClick={() => navigate('/dashboard/inicio')}>
            <Icon d={icons.home} size={18} color={isActive('/dashboard/inicio') ? '#6366f1' : '#94a3b8'} /> Inicio
          </button>
          
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', margin: '24px 0 8px 16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Gestión</div>
          <button style={getLinkStyle('/dashboard/ventas-local')} onClick={() => navigate('/dashboard/venta-local')}>
            <Icon d={icons.orders} size={18} color={isActive('/dashboard/ventas-local') || isActive('/dashboard/venta-local') ? '#6366f1' : '#94a3b8'} /> Ventas en Local
          </button>
          <button style={getLinkStyle('/dashboard/productos')} onClick={() => navigate('/dashboard/productos')}>
            <Icon d={icons.package} size={18} color={isActive('/dashboard/productos') ? '#6366f1' : '#94a3b8'} /> Productos & Stock
          </button>
          <button style={getLinkStyle('/dashboard/categorias')} onClick={() => navigate('/dashboard/categorias')}>
            <Icon d={icons.category} size={18} color={isActive('/dashboard/categorias') ? '#6366f1' : '#94a3b8'} /> Categorías
          </button>
          <button style={getLinkStyle('/dashboard/estadisticas')} onClick={() => navigate('/dashboard/estadisticas')}>
            <Icon d={icons.stats} size={18} color={isActive('/dashboard/estadisticas') ? '#6366f1' : '#94a3b8'} /> Estadísticas
          </button>
          <button style={getLinkStyle('/dashboard/diseno')} onClick={() => navigate('/dashboard/diseno')}>
            <Icon d={icons.design} size={18} color={isActive('/dashboard/diseno') ? '#6366f1' : '#94a3b8'} /> Diseño & Colores
          </button>
          
          <button style={getLinkStyle('/dashboard/pedidos')} onClick={() => navigate('/dashboard/pedidos')}>
            <Icon d={icons.orders} size={18} color={isActive('/dashboard/pedidos') ? '#6366f1' : '#94a3b8'} /> Ventas & Pedidos
            <Badge count={pedidosNuevosCount} />

          </button>

          <button style={getLinkStyle('/dashboard/ordenes-envios')} onClick={() => navigate('/dashboard/ordenes-envios')}>
  <Icon d={icons.package} size={18} color={isActive('/dashboard/ordenes-envios') ? '#6366f1' : '#94a3b8'} /> Órdenes y Envíos
</button>

          <button style={getLinkStyle('/dashboard/transferencias')} onClick={() => navigate('/dashboard/transferencias')}>
            <Icon d={icons.orders} size={18} color={isActive('/dashboard/transferencias') ? '#6366f1' : '#94a3b8'} /> Transferencias
            <Badge count={transferenciasCount} />
          </button>

          <button style={getLinkStyle('/dashboard/puntos-entrega')} onClick={() => navigate('/dashboard/puntos-entrega')}>
            <Icon d={icons.package} size={18} color={isActive('/dashboard/puntos-entrega') ? '#6366f1' : '#94a3b8'} /> Puntos de Entrega
          </button>

          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', margin: '24px 0 8px 16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Ajustes</div>
          <button style={getLinkStyle('/dashboard/configuracion')} onClick={() => navigate('/dashboard/configuracion')}>
            <Icon d={icons.design} size={18} color={isActive('/dashboard/configuracion') ? '#6366f1' : '#94a3b8'} /> Configuración General
          </button>
          
        </nav>
      </aside>

      {/* 🌟 CONTENEDOR PRINCIPAL (MAIN) 🌟 */}
      {/* Se agregó padding de 80px superior en móviles para no pisar el Top Bar, y 16px de márgenes laterales seguros */}
      <main style={{
        flex: 1, 
        padding: isMobile ? '80px 16px 24px' : '20px 40px',
        maxWidth: '100vw', 
        boxSizing: 'border-box', 
        overflowX: 'hidden', 
        margin: 0
      }}>
        <Outlet /> 
      </main>
    </div>
  );
};

export default Dashboard;