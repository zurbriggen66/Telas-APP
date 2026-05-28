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

urlpatterns = [
    path('api/banner/', views.get_main_banner, name='main-banner'),
    #path('api/mercadopago/preference/', views.MercadoPagoPreferenceView.as_view(), name='mp-preference'),
    
    # NUEVA RUTA PARA DESCONTAR STOCK Y CREAR PEDIDOS (Transferencia o MP)
    path('api/pedidos/crear/', views.CrearPedidoView.as_view(), name='crear_pedido'),
    path('api/productos-az/', views.ProductoAZList.as_view(), name='productos-az'),
    path('api/mercadopago/webhook/', views.webhook_mercadopago, name='mp-webhook'),
    path('api/mercadopago/success/', views.success_redirect, name='mp-success'),
    path('api/estadisticas/', views.api_estadisticas, name='api_estadisticas'),
    

    # 👇 NUEVA RUTA PARA GENERAR LA ETIQUETA DE UN PEDIDO ESPECÍFICO 👇
    path('api/pedidos/<int:pedido_id>/generar-etiqueta/', views.generar_etiqueta_envio_view, name='generar_etiqueta'),

    path('api/cotizar-envio/', views.cotizar_envio_api, name='cotizar_envio'),

    

    # El router siempre debe ir al final
    path('api/', include(router.urls)),
]