from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categorias', views.CategoriaViewSet, basename='categoria')
router.register(r'productos', views.ProductoViewSet, basename='producto')
router.register(r'pedidos', views.PedidoViewSet)
# ... tus otras rutas ...
router.register(r'tarifas-locales', views.TarifaLocalViewSet)
router.register(r'colores', views.ColorViewSet) # 👈 NUEVA RUTA
router.register(r'usos', views.UsoTelaViewSet)
# ...
# una linea de comentario
#otra linea de comentario mas la anterior

urlpatterns = [
    path('api/banner/', views.get_main_banner, name='main-banner'),
    #path('api/mercadopago/preference/', views.MercadoPagoPreferenceView.as_view(), name='mp-preference'),
    
    # NUEVA RUTA PARA DESCONTAR STOCK Y CREAR PEDIDOS (Transferencia o MP)
    path('api/pedidos/crear/', views.CrearPedidoView.as_view(), name='crear_pedido'),
    path('api/productos-az/', views.ProductoAZList.as_view(), name='productos-az'),
    path('api/mercadopago/webhook/', views.webhook_mercadopago, name='mp-webhook'),
    path('api/mercadopago/success/', views.success_redirect, name='mp-success'),
    path('api/estadisticas/', views.api_estadisticas, name='api_estadisticas'),
    path('api/pedido/venta-local/', views.RegistrarVentaLocalView.as_view(), name='venta_local'),
    path('envio/sucursales/', views.obtener_sucursales_api, name='obtener_sucursales'),
    path('api/rastrear/<str:tracking_number>/', views.RastrearPedidoView.as_view(), name='rastrear_pedido'),
    

    # 👇 NUEVA RUTA PARA GENERAR LA ETIQUETA DE UN PEDIDO ESPECÍFICO 👇
   
    path('api/cotizar-envio/', views.cotizar_envio_api, name='cotizar_envio'),

    path('api/mercadopago/callback/', views.mercadopago_callback, name='mp_callback'),

    path('api/dashboard/inicio/', views.api_dashboard_inicio, name='dashboard_inicio'),
    path('api/estadisticas/realtime/', views.api_realtime_usuarios),

    

    # El router siempre debe ir al final
    path('api/', include(router.urls)),
]