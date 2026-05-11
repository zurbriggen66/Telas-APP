from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categorias', views.CategoriaViewSet, basename='categoria')
router.register(r'productos', views.ProductoViewSet, basename='producto')

urlpatterns = [
    path('api/banner/', views.get_main_banner, name='main-banner'),
    
    # NUEVA RUTA PARA MERCADO PAGO
    path('api/mercadopago/preference/', views.MercadoPagoPreferenceView.as_view(), name='mp-preference'),
    
    path('api/', include(router.urls)),
]