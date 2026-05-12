from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categorias', views.CategoriaViewSet, basename='categoria')
router.register(r'productos', views.ProductoViewSet, basename='producto')
router.register(r'pedidos', views.PedidoViewSet)

urlpatterns = [
    path('api/banner/', views.get_main_banner, name='main-banner'),
    path('api/mercadopago/preference/', views.MercadoPagoPreferenceView.as_view(), name='mp-preference'),
    
    # NUEVA RUTA PARA DESCONTAR STOCK
    path('api/mercadopago/webhook/', views.webhook_mercadopago, name='mp-webhook'),
    
    path('api/mercadopago/success/', views.success_redirect, name='mp-success'),

    path('api/', include(router.urls)),
]