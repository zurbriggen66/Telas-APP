from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categorias', views.CategoriaViewSet, basename='categoria')
router.register(r'productos', views.ProductoViewSet, basename='producto')

urlpatterns = [
    path('api/banner/', views.get_main_banner, name='main-banner'),
    path('api/mercadopago/preference/', views.MercadoPagoPreferenceView.as_view(), name='mp-preference'),
    
    # NUEVA RUTA PARA DESCONTAR STOCK
    path('api/pedidos/confirmar/', views.confirmar_pedido, name='confirmar-pedido'),
    
    path('api/', include(router.urls)),
]