import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';

// Importamos el Layout (el esqueleto)
import Dashboard from './pages/Dashboard';

// Importamos las páginas fragmentadas
import VistaInicio from './pages/dashboard/VistaInicio';
import VistaProductos from './pages/dashboard/VistaProductos';
import VistaCategorias from './pages/dashboard/VistaCategorias';
import VistaDiseno from './pages/dashboard/Vistadiseno';
import VistaStats from './pages/dashboard/VistaStats';
import VistaPedidos from './pages/dashboard/VistaPedidos';
import VistaTransferencias from './pages/dashboard/VistaTransferencias';
import VistaPuntosEntrega from './pages/dashboard/VistaPuntosEntrega';

// Importamos las páginas públicas
import Home from './pages/Home/Home.jsx';
import Carrito from './pages/Carrito/Carrito.jsx';
import DetalleProducto from './pages/Detalle producto/Detalle_producto.jsx';
import CheckoutSelection from './pages/Checkoutselection/CheckoutSelection.jsx';
import Success from './pages/Success/Success.jsx'; 
import TransferenciaSuccess from './pages/TransferenciaSuccess'; 
import Productos from './pages/Products/Products.jsx';
import Footer from './pages/Footer/Footer.jsx';

// 👇 1. IMPORTAMOS EL NUEVO COMPONENTE ACÁ 👇
import WhatsAppFlotante from './components/WhatsAppFlotante'; 

// CREAMOS EL COMPONENTE SCROLL-TO-TOP
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Cada vez que cambia la ruta (pathname), forzamos la ventana a subir
    window.scrollTo(0, 0);
  }, [pathname]);

  return null; // Este componente es invisible, solo ejecuta la lógica
};

// LAYOUT PÚBLICO (Con Footer y WhatsApp Flotante)
const PublicLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main style={{ flex: 1 }}>
        <Outlet /> 
      </main>
      
      {/* 👇 2. LO INTEGRÁS ACÁ: Se ve en toda la web menos en el Admin Panel 👇 */}
      <WhatsAppFlotante />
      
      <Footer />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      {/* COLOCAMOS EL SCROLL-TO-TOP ACÁ */}
      <ScrollToTop />
      
      <Routes>
        {/* === RUTAS PÚBLICAS (Agrupadas adentro del Layout con Footer y WhatsApp) === */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/producto/:id" element={<DetalleProducto />} />
          <Route path="/productos" element={<Productos />} />
          
          {/* RUTAS DE PAGO */}
          <Route path="/checkout" element={<CheckoutSelection />} />
          <Route path="/success" element={<Success />} /> 
          <Route path="/transferencia-success" element={<TransferenciaSuccess />} />
        </Route>

        {/* === RUTA PADRE: DASHBOARD (Aislado, libre del Footer y de WhatsApp) === */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<VistaInicio />} />
          <Route path="productos" element={<VistaProductos />} />
          <Route path="categorias" element={<VistaCategorias />} />
          <Route path="diseno" element={<VistaDiseno />} />
          <Route path="estadisticas" element={<VistaStats />} />
          <Route path="pedidos" element={<VistaPedidos />} />
          <Route path="transferencias" element={<VistaTransferencias />} />
          <Route path="puntos-entrega" element={<VistaPuntosEntrega />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;