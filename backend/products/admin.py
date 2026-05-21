from django.contrib import admin
from .models import StoreConfiguration, Categoria, Producto, ProductoImagen, TarifaLocal

class ProductoImagenInline(admin.TabularInline):
    model = ProductoImagen
    extra = 1

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre'] # Correcto, ya no existe categoria_padre

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    # 1. EN LIST_DISPLAY: Usamos 'mostrar_categorias' (la función de abajo) en lugar de 'categoria'
    list_display = ('nombre', 'mostrar_categorias', 'precio_por_metro', 'ancho_cm', 'stock_metros')
    
    # 2. EN LIST_FILTER: Cambiamos 'categoria' por 'categorias' (el nuevo nombre del campo)
    list_filter = ('categorias', 'ancho_cm')
    search_fields = ('nombre', 'descripcion')
    inlines = [ProductoImagenInline]

    # Esta función es la que permite ver las categorías en la lista
    def mostrar_categorias(self, obj):
        return ", ".join([cat.nombre for cat in obj.categorias.all()])
    
    mostrar_categorias.short_description = 'Categorías' # Título de la columna

@admin.register(StoreConfiguration)
class StoreConfigurationAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active')

@admin.register(TarifaLocal)
class TarifaLocalAdmin(admin.ModelAdmin):
    list_display = ['localidad', 'codigo_postal', 'costo_envio', 'activo']
    list_editable = ['costo_envio', 'activo'] # Te permite editar los precios rápido desde la lista sin entrar a cada uno
    search_fields = ['localidad', 'codigo_postal']