# 🖼️ Guía de Optimización de Imágenes con Pillow

## ¿Qué se implementó?

Tu proyecto Django ahora tiene un sistema completo de optimización de imágenes usando **Pillow**. Las imágenes se comprimen automáticamente cuando se suben, reduciendo el tamaño de archivos sin perder demasiada calidad.

## 📁 Archivos nuevos creados

### 1. **`products/image_utils.py`**
Módulo de utilidades con funciones para:
- `optimize_image()`: Comprime y redimensiona imágenes
- `get_image_size_kb()`: Obtiene el tamaño en KB de una imagen

### 2. **`products/management/commands/optimize_images.py`**
Comando de gestión para optimizar todas las imágenes existentes en la base de datos.

## 🔧 Configuración automática

Se agregaron **Django Signals** en `products/models.py`:

```python
@receiver(pre_save, sender='products.Categoria')
def optimize_categoria_image(sender, instance, **kwargs):
    """Optimiza la imagen de categoría antes de guardar"""
```

Esto significa que **cada vez que guardes una imagen**, automáticamente:
1. Se redimensiona a un tamaño máximo
2. Se comprime a 85% de calidad (balance entre tamaño y calidad)
3. Se convierte a JPEG si es necesario (más ligero que PNG)

## 📊 Parámetros de optimización por tipo

| Tipo | Ancho Máx | Alto Máx | Calidad |
|------|-----------|----------|---------|
| Categorías | 500px | 500px | 85% |
| Productos | 1000px | 1000px | 85% |
| Galería | 800px | 800px | 85% |
| Banners | 2000px | 1200px | 85% |

## 🚀 Cómo usar

### Opción 1: Optimización automática (RECOMENDADO)
Las imágenes se optimizan automáticamente al subirlas. ¡No tienes que hacer nada!

### Opción 2: Optimizar imágenes existentes

#### Ver qué se optimizaría (sin cambios):
```bash
python manage.py optimize_images --dry-run
```

#### Optimizar todas las imágenes:
```bash
python manage.py optimize_images
```

## 📈 Resultados esperados

Con Pillow obtendrás típicamente:
- ✅ Reducción de **30-60%** en tamaño de imágenes
- ✅ Carga más rápida del sitio
- ✅ Menor uso de ancho de banda
- ✅ Mejor experiencia de usuario

## 💾 Dependencias agregadas

Se añadió a `requirements.txt`:
```
Pillow==12.1.0
```

## 🎯 Cómo personalizar

Si quieres cambiar los parámetros de optimización, edita `core/settings.py`:

```python
IMAGE_OPTIMIZATION_SETTINGS = {
    'PRODUCT_IMAGES': {
        'max_width': 1000,      # Cambiar ancho máximo
        'max_height': 1000,     # Cambiar alto máximo
        'quality': 85,          # Cambiar calidad (1-100)
    },
    # ... etc
}
```

## 🔍 Monitoreo

Para verificar que las imágenes se están optimizando:

1. Sube una imagen grande a través del admin
2. Verifica en `media/` que el archivo sea más pequeño que el original
3. Compara los tamaños en KB

## ⚠️ Notas importantes

- Las imágenes PNG se convierten a JPEG (más ligeras)
- La calidad 85% es un buen balance entre tamaño y apariencia
- Si subes imágenes MUY grandes (>5MB), se pueden comprimir significativamente
- Los cambios de optimización se aplican al guardar en la BD, no al acceder

## 🆘 Troubleshooting

### Las imágenes no se optimizan
1. Verifica que `products` esté en `INSTALLED_APPS` de settings.py
2. Revisa que `apps.py` tenga el método `ready()` configurado
3. Reinicia el servidor Django

### Error "PIL/Image no encontrado"
Asegúrate de instalar Pillow:
```bash
pip install Pillow
```

## 📝 Próximos pasos

Considera también:
- Generar thumbnails automáticos
- Servir imágenes en formato WebP para navegadores modernos
- Usar CDN como CloudFront o S3 para servir imágenes
