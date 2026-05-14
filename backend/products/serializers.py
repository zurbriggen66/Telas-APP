from rest_framework import serializers
from .models import Categoria, Pedido, Producto, ProductoImagen, StoreConfiguration

# 1. Serializer para la configuración (Banner)
class StoreConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreConfiguration
        fields = '__all__'

# 2. Serializer para las imágenes de la galería
class ProductoImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductoImagen
        fields = ['id', 'imagen', 'producto']

# 3. Serializer para las Categorías (con jerarquía)
class CategoriaSerializer(serializers.ModelSerializer):
    # Exponemos el nombre del padre para que el frontend lo muestre fácil
    nombre_padre = serializers.CharField(source='categoria_padre.nombre', read_only=True)

    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'imagen', 'categoria_padre', 'nombre_padre']

# 4. Serializer para los Productos (Telas)
class ProductoSerializer(serializers.ModelSerializer):
    # Mantenemos las imágenes de la galería anidadas
    imagenes_galeria = ProductoImagenSerializer(many=True, read_only=True)

    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio_por_metro', 
            'ancho_cm', 'stock_metros', 'categoria', 
            'imagen', 'imagenes_galeria'
        ]

    def to_representation(self, instance):
        """
        Esta función transforma la salida de los datos. 
        En la base de datos se guarda el ID, pero a React le llega el Nombre.
        """
        representation = super().to_representation(instance)
        
        # Reemplazamos el ID numérico por el nombre de la categoría (__str__)
        if instance.categoria:
            representation['categoria'] = str(instance.categoria)
            
        return representation

class PedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pedido
        fields = '__all__'