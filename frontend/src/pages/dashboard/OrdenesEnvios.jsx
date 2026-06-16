import React, { useState, useEffect } from 'react';
import './OrdenesEnvios.css';

const OrdenesEnvios = () => {
  const [pedidos, setPedidos] = useState([]);
  const [trackingInputs, setTrackingInputs] = useState({});
  const [cargandoId, setCargandoId] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    cargarPedidosAprobados();
  }, []);

  const cargarPedidosAprobados = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pedidos/`);
      if (response.ok) {
        const data = await response.json();
        const aprobados = data.filter(p => p.estado === 'Aprobado' || p.estado === 'APROBADO');
        setPedidos(aprobados);
      }
    } catch (error) {
      mostrarToast("Error de conexión al cargar los pedidos.", "error");
    }
  };

  const handleTrackingChange = (id, valor) => {
    setTrackingInputs(prev => ({ ...prev, [id]: valor }));
  };

  const mostrarToast = (mensaje, tipo = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const despacharPedido = async (id) => {
    const tracking = trackingInputs[id];
    
    if (!tracking || tracking.trim() === '') {
      mostrarToast("Por favor, ingresá el N° de seguimiento.", "error");
      return;
    }

    setCargandoId(id);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pedidos/${id}/despachar_pedido/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_number: tracking })
      });

      if (response.ok) {
        mostrarToast("¡Despachado! Mail enviado al cliente.", "success");
        setTrackingInputs(prev => ({ ...prev, [id]: '' }));
        cargarPedidosAprobados();
      } else {
        const errorData = await response.json();
        mostrarToast(errorData.error || "Error al despachar el pedido", "error");
      }
    } catch (error) {
      mostrarToast("Error de conexión al servidor.", "error");
    } finally {
      setCargandoId(null);
    }
  };

  return (
    <div className="ordenes-container">
      <div className="ordenes-header">
        <h1>Órdenes y Envíos</h1>
        <p>Gestioná los paquetes listos para despachar e informá a tus clientes.</p>
      </div>

      {/* MENSAJE INFORMATIVO */}
      <div className="info-banner">
        <span className="info-banner-icon">💡</span>
        <div>
          <strong>Recordatorio para tus despachos:</strong> 
          Para procesar tus envíos, primero debés ingresar a la página de <b>Correo Argentino</b>, definir las medidas del paquete y registrar el destino (si es a domicilio o a sucursal). Una vez despachado, ingresá aquí el número de seguimiento para notificar al cliente.
        </div>
      </div>

      {pedidos.length === 0 ? (
        <div className="ordenes-empty">
          No hay pedidos pendientes de despacho en este momento.
        </div>
      ) : (
        <div className="ordenes-grid">
          {pedidos.map(pedido => {
            const esVentaLocal = pedido.email_cliente === "local@telasapp.com" || pedido.nombre_cliente === "Cliente Local";
            const nombreMostrar = esVentaLocal ? "Venta en Local" : pedido.nombre_cliente;

            return (
              <div key={pedido.id} className="pedido-card">
                
                <div className="pedido-card-header">
                  <h3 className="pedido-id">#{pedido.id}</h3>
                  <span className="badge-aprobado">Aprobado</span>
                </div>

                <div className="pedido-body">
                  <div className="dato-fila">
                    <span className="dato-icon">👤</span>
                    <div className="dato-text">
                      <strong>Cliente</strong>
                      {nombreMostrar}
                    </div>
                  </div>

                  {/* El email se muestra siempre y cuando no sea una venta ficticia de mostrador */}
                  {!esVentaLocal && (
                    <div className="dato-fila">
                      <span className="dato-icon">✉️</span>
                      <div className="dato-text">
                        <strong>Email de Contacto</strong>
                        {pedido.email_cliente}
                      </div>
                    </div>
                  )}

                  <div className="dato-fila">
                    <span className="dato-icon">📍</span>
                    <div className="dato-text">
                      <strong>Destino / Modalidad</strong>
                      {pedido.direccion_envio}
                    </div>
                  </div>

                  <div className="dato-fila" style={{ display: 'block', marginTop: '16px' }}>
                    <div className="dato-text">
                      <strong>📦 Detalle de Productos</strong>
                    </div>
                    <div className="productos-box">
                      {pedido.detalle_items}
                    </div>
                  </div>
                </div>

                <div className="despacho-section">
                  <label>N° de Seguimiento</label>
                  <input 
                    type="text" 
                    className="tracking-input"
                    placeholder="Ej: CP123456789AR" 
                    value={trackingInputs[pedido.id] || ''}
                    onChange={(e) => handleTrackingChange(pedido.id, e.target.value)}
                  />
                  
                  <button 
                    className="btn-despachar"
                    onClick={() => despacharPedido(pedido.id)}
                    disabled={cargandoId === pedido.id}
                  >
                    {cargandoId === pedido.id ? 'Procesando...' : 'Despachar y Notificar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contenedor flotante para los Toasts */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.tipo}`}>
            <span className="toast-icon">
              {toast.tipo === 'success' ? '✅' : '⚠️'}
            </span>
            <span className="toast-message">{toast.mensaje}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdenesEnvios;