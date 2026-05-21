from rest_framework import serializers
from .models import Categoria, Pedido, Producto, ProductoImagen, StoreConfiguration, PedidoItem

# 1. Serializer para la configuración (Banner)
class StoreConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreConfiguration
        exclude = ['api_key_envia']  # No enviamos el token de Envia.com al frontend por seguridad

# 2. Serializer para las imágenes de la galería
class ProductoImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductoImagen
        fields = ['id', 'imagen', 'producto']

# 3. Serializer para las Categorías (simplificado)
class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'imagen']

# 4. Serializer para los Productos (Telas)
class ProductoSerializer(serializers.ModelSerializer):
    imagenes_galeria = ProductoImagenSerializer(many=True, read_only=True)
    
    # ⚠️ NUEVO: Enviaremos a React un array con los nombres de las categorías para que sea fácil mostrarlas
    categorias_nombres = serializers.StringRelatedField(many=True, source='categorias', read_only=True)

    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio_por_metro', 
            'ancho_cm', 'stock_metros', 'es_favorito',
            'categorias', # Recibe/envía un array de IDs (ej: [11, 15])
            'categorias_nombres', # Envía a React un array de nombres (ej: ["Gamuza", "Algodón"])
            'imagen', 'imagenes_galeria'
        ]

class PedidoItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PedidoItem
        fields = ['id', 'producto', 'nombre_producto', 'cantidad_metros', 'precio_unitario']

class PedidoSerializer(serializers.ModelSerializer):
    items = PedidoItemSerializer(many=True, read_only=True)

    class Meta:
        model = Pedido
        fields = [
            'id', 'mp_id', 'nombre_cliente', 'email_cliente', 'telefono_cliente',
            'total', 'metodo_pago', 'estado', 'detalle_items', 'items', 'fecha_creacion','direccion_envio', 'costo_envio', 'tipo_envio', 'envia_carrier', 'envia_service'
        ]

class ProductoDesplegableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        # Solo necesitamos el ID para la URL y el nombre para mostrar
        fields = ['id', 'nombre']