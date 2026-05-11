from django.contrib import admin
from .models import StoreConfiguration, Categoria, Producto, ProductoImagen

# Esto permite cargar imágenes adicionales directamente desde la pantalla de creación del producto
class ProductoImagenInline(admin.TabularInline):
    model = ProductoImagen
    extra = 1

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    # Mostramos si tiene categoría padre en la lista
    list_display = ('nombre', 'categoria_padre')
    list_filter = ('categoria_padre',)
    search_fields = ('nombre', 'descripcion')

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    # ¡Acá estaba el error! Reemplazamos 'precio' y 'talle' por los nuevos campos
    list_display = ('nombre', 'categoria', 'precio_por_metro', 'ancho_cm', 'stock_metros')
    
    # Agregamos filtros laterales útiles para buscar telas
    list_filter = ('categoria', 'ancho_cm')
    search_fields = ('nombre', 'descripcion')
    
    # Agregamos el inline para subir varias imágenes a la vez
    inlines = [ProductoImagenInline]

@admin.register(StoreConfiguration)
class StoreConfigurationAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active')