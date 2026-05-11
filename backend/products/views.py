from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status, viewsets

from .models import Producto, StoreConfiguration, Categoria, ProductoImagen
from .serializers import CategoriaSerializer, StoreConfigurationSerializer, ProductoSerializer, ProductoImagenSerializer

# Ahora aceptamos GET (leer) y POST (guardar)
@api_view(['GET', 'POST'])
# Estos parsers son obligatorios para que Django entienda que viene un archivo, no solo texto
@parser_classes([MultiPartParser, FormParser])
def get_main_banner(request):
    config = StoreConfiguration.objects.filter(is_active=True).first()
    
    if request.method == 'GET':
        if config:
            serializer = StoreConfigurationSerializer(config, context={'request': request})
            return Response(serializer.data)
        return Response({"error": "No hay configuración activa"}, status=status.HTTP_404_NOT_FOUND)
        
    elif request.method == 'POST':
        # Si ya existe una configuración, la actualizamos. Si no, creamos una nueva.
        if config:
            serializer = StoreConfigurationSerializer(config, data=request.data, partial=True, context={'request': request})
        else:
            serializer = StoreConfigurationSerializer(data=request.data, context={'request': request})
            
        if serializer.is_valid():
            # Guardamos y aseguramos que quede como la configuración activa
            serializer.save(is_active=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        # Si el cliente mandó un archivo corrupto, le avisamos
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# ... (tus imports y get_main_banner quedan exactamente igual) ...

class CategoriaViewSet(viewsets.ModelViewSet):
    """
    Este ViewSet proporciona automáticamente las acciones:
    `list`, `create`, `retrieve`, `update` (PATCH) y `destroy` (DELETE).
    """
    # OPTIMIZACIÓN: Usamos select_related para traer los datos del "padre" en la misma consulta a la DB
    queryset = Categoria.objects.select_related('categoria_padre').all()
    serializer_class = CategoriaSerializer


class ProductoViewSet(viewsets.ModelViewSet):
    # OPTIMIZACIÓN: Usamos select_related para traer los datos de la categoría en la misma consulta
    queryset = Producto.objects.select_related('categoria').all()
    serializer_class = ProductoSerializer

    def create(self, request, *args, **kwargs):
        # 1. Creamos el producto base con los datos estándar
        response = super().create(request, *args, **kwargs)
        producto = Producto.objects.get(id=response.data['id'])
        
        # 2. Guardamos las imágenes extra de la galería
        self._guardar_imagenes_galeria(request, producto)
        return response

    def update(self, request, *args, **kwargs):
        producto_id = kwargs.get('pk')

        # 1. Eliminar las imágenes que el usuario quitó en el frontend
        imagenes_a_eliminar = request.data.getlist('eliminar_imagenes')
        
        if imagenes_a_eliminar:
            # Borramos las imágenes de la base de datos (esto también borra el archivo físico gracias al cascade)
            ProductoImagen.objects.filter(id__in=imagenes_a_eliminar, producto_id=producto_id).delete()

        # 2. Actualizar el producto base (nombre, precio, etc.)
        response = super().update(request, *args, **kwargs)
        producto = self.get_object()

        # 3. Guardar las NUEVAS imágenes extra que se hayan agregado
        self._guardar_imagenes_galeria(request, producto)
        
        return response

    def _guardar_imagenes_galeria(self, request, producto):
        """Función auxiliar para buscar y guardar archivos 'imagen_extra_X'"""
        for key, file in request.FILES.items():
            if key.startswith('imagen_extra_'):
                ProductoImagen.objects.create(producto=producto, imagen=file)