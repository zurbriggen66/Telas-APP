"""
Utilidades para optimizar y procesar imágenes con Pillow.
Reduce el tamaño de las imágenes manteniendo buena calidad.
"""

from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import os


def optimize_image(image_field, max_width=1200, max_height=1200, quality=85):
    """
    Optimiza una imagen para reducir su tamaño.
    
    Args:
        image_field: Campo ImageField de Django
        max_width: Ancho máximo en píxeles
        max_height: Alto máximo en píxeles
        quality: Calidad JPEG (1-100, recomendado 80-90)
    
    Returns:
        ContentFile con la imagen optimizada
    """
    if not image_field:
        return None
    
    try:
        # Abrir la imagen
        img = Image.open(image_field)
        
        # Convertir a RGB si tiene canal alfa (PNG, GIF)
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        
        # Redimensionar si es necesario (mantiene proporción)
        img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
        
        # Guardar en BytesIO para procesamiento
        image_buffer = BytesIO()
        
        # Determinar formato
        format_to_save = 'JPEG' if img.format != 'PNG' or img.mode == 'RGB' else 'PNG'
        
        # Guardar con optimización
        if format_to_save == 'JPEG':
            img.save(image_buffer, format='JPEG', quality=quality, optimize=True)
        else:
            img.save(image_buffer, format='PNG', optimize=True)
        
        # Preparar para retornar
        image_buffer.seek(0)
        
        # Obtener nombre del archivo
        file_name = os.path.basename(image_field.name)
        
        # Si era PNG, cambiar extensión a .jpg (ya que convertimos a RGB)
        if format_to_save == 'JPEG' and file_name.endswith('.png'):
            file_name = file_name.replace('.png', '.jpg')
        
        return ContentFile(image_buffer.getvalue(), name=file_name)
    
    except Exception as e:
        print(f"Error optimizando imagen: {str(e)}")
        return image_field  # Retornar original si hay error


def get_image_size_kb(image_field):
    """
    Retorna el tamaño de la imagen en KB.
    """
    if not image_field:
        return 0
    
    try:
        return round(image_field.size / 1024, 2)
    except:
        return 0
