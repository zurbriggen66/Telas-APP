from rest_framework import serializers
from .models import Categoria, Producto, ProductoImagen, StoreConfiguration

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
    # Agregamos el nombre de la categoría para no mandar solo el ID
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    
    # Anidamos las imágenes de la galería para que React las reciba de una vez
    imagenes_galeria = ProductoImagenSerializer(many=True, read_only=True)

    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio_por_metro', 
            'ancho_cm', 'stock_metros', 'categoria', 'categoria_nombre', 
            'imagen', 'imagenes_galeria'
        ]