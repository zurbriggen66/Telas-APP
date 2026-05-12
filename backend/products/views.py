from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
import mercadopago
from rest_framework import status, viewsets
from django.conf import settings
from rest_framework.views import APIView
from django.db import transaction # NUEVO IMPORT PARA SEGURIDAD DE STOCK

from .models import Producto, StoreConfiguration, Categoria, ProductoImagen
from .serializers import CategoriaSerializer, StoreConfigurationSerializer, ProductoSerializer, ProductoImagenSerializer

@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser])
def get_main_banner(request):
    config = StoreConfiguration.objects.filter(is_active=True).first()
    
    if request.method == 'GET':
        if config:
            serializer = StoreConfigurationSerializer(config, context={'request': request})
            return Response(serializer.data)
        return Response({"error": "No hay configuración activa"}, status=status.HTTP_404_NOT_FOUND)
        
    elif request.method == 'POST':
        if config:
            serializer = StoreConfigurationSerializer(config, data=request.data, partial=True, context={'request': request})
        else:
            serializer = StoreConfigurationSerializer(data=request.data, context={'request': request})
            
        if serializer.is_valid():
            serializer.save(is_active=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.select_related('categoria_padre').all()
    serializer_class = CategoriaSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.select_related('categoria').all()
    serializer_class = ProductoSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        producto = Producto.objects.get(id=response.data['id'])
        self._guardar_imagenes_galeria(request, producto)
        return response

    def update(self, request, *args, **kwargs):
        producto_id = kwargs.get('pk')
        imagenes_a_eliminar = request.data.getlist('eliminar_imagenes')
        
        if imagenes_a_eliminar:
            ProductoImagen.objects.filter(id__in=imagenes_a_eliminar, producto_id=producto_id).delete()

        response = super().update(request, *args, **kwargs)
        producto = self.get_object()
        self._guardar_imagenes_galeria(request, producto)
        return response

    def _guardar_imagenes_galeria(self, request, producto):
        for key, file in request.FILES.items():
            if key.startswith('imagen_extra_'):
                ProductoImagen.objects.create(producto=producto, imagen=file)
class MercadoPagoPreferenceView(APIView):
    def post(self, request):
        try:
            # ACÁ PUSIMOS TU ACCESS TOKEN DE PRUEBA
            sdk = mercadopago.SDK("APP_USR-1917487181339285-051122-426205322cae03264b84dd8070b963b0-3151002850")

            cart_items = request.data.get('items', [])
            items_for_mp = []

            for item in cart_items:
                items_for_mp.append({
                    "id": str(item.get('id', '1')),
                    "title": str(item.get('nombre', 'Corte de Tela')),
                    "quantity": int(item.get('cantidad', 1)),
                    "unit_price": float(item.get('precio_por_metro', 0)),
                    "currency_id": "ARS",
                })

            # Aseguramos el formato exacto que pide MP usando localhost
            preference_data = {
                "items": items_for_mp,
                "back_urls": {
                    "success": "http://localhost:5173/success",
                    "failure": "http://localhost:5173/checkout",
                    "pending": "http://localhost:5173/checkout"
                },
                #"auto_return": "approved",#
                "binary_mode": True
            }

            preference_response = sdk.preference().create(preference_data)
            status_code = preference_response["status"]
            response_data = preference_response["response"]

            if status_code >= 400:
                print("\n❌ --- ERROR DE MERCADO PAGO --- ❌")
                print(response_data)
                print("❌ ----------------------------- ❌\n")
                return Response(response_data, status=status_code)

            return Response({'id': response_data['id']}, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"\n❌ ERROR DE PYTHON: {str(e)} ❌\n")
            return Response({"error": str(e)}, status=500)

# NUEVA LÓGICA DE DESCUENTO DE STOCK
@api_view(['POST'])
def confirmar_pedido(request):
    try:
        # with transaction.atomic() asegura que si algo falla, no se guarda nada en la base de datos
        with transaction.atomic():
            cart_items = request.data.get('items', [])
            
            for item in cart_items:
                producto = Producto.objects.select_for_update().get(id=item['id'])
                metros_comprados = float(item['cantidad'])
                
                # Validamos que siga habiendo stock al momento de pagar
                if producto.stock_metros >= metros_comprados:
                    producto.stock_metros -= metros_comprados
                    producto.save()
                else:
                    return Response(
                        {"error": f"Oops, alguien compró {producto.nombre} antes que vos y nos quedamos sin stock suficiente."}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
            return Response({"mensaje": "Stock descontado con éxito"}, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)