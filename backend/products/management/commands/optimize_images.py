"""
Comando de gestión para optimizar todas las imágenes del proyecto.
Uso: python manage.py optimize_images
"""

from django.core.management.base import BaseCommand
from django.core.files.storage import default_storage
from products.models import Categoria, Producto, ProductoImagen, StoreConfiguration
from products.image_utils import optimize_image, get_image_size_kb


class Command(BaseCommand):
    help = 'Optimiza todas las imágenes de productos, categorías y galería para reducir su tamaño'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simula la optimización sin guardar cambios',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        
        self.stdout.write(self.style.SUCCESS('Iniciando optimización de imágenes...'))
        if dry_run:
            self.stdout.write(self.style.WARNING('(Modo DRY-RUN - sin guardar cambios)'))
        
        total_ahorrado = 0
        
        # Optimizar imágenes de Categorías
        self.stdout.write('\n📁 Optimizando categorías...')
        categorias = Categoria.objects.filter(imagen__isnull=False).exclude(imagen='')
        for categoria in categorias:
            size_antes = get_image_size_kb(categoria.imagen)
            optimized = optimize_image(categoria.imagen, max_width=500, max_height=500, quality=85)
            size_despues = get_image_size_kb(optimized)
            ahorro = size_antes - size_despues
            total_ahorrado += ahorro
            
            self.stdout.write(f"  ✓ {categoria.nombre}: {size_antes}KB → {size_despues}KB (Ahorro: {ahorro}KB)")
            
            if not dry_run:
                categoria.imagen = optimized
                categoria.save()
        
        # Optimizar imágenes de Productos
        self.stdout.write('\n🛍️  Optimizando productos...')
        productos = Producto.objects.filter(imagen__isnull=False).exclude(imagen='')
        for producto in productos:
            size_antes = get_image_size_kb(producto.imagen)
            optimized = optimize_image(producto.imagen, max_width=1000, max_height=1000, quality=85)
            size_despues = get_image_size_kb(optimized)
            ahorro = size_antes - size_despues
            total_ahorrado += ahorro
            
            self.stdout.write(f"  ✓ {producto.nombre}: {size_antes}KB → {size_despues}KB (Ahorro: {ahorro}KB)")
            
            if not dry_run:
                producto.imagen = optimized
                producto.save()
        
        # Optimizar imágenes de Galería
        self.stdout.write('\n🖼️  Optimizando galería de productos...')
        galeria = ProductoImagen.objects.filter(imagen__isnull=False).exclude(imagen='')
        for img in galeria:
            size_antes = get_image_size_kb(img.imagen)
            optimized = optimize_image(img.imagen, max_width=800, max_height=800, quality=85)
            size_despues = get_image_size_kb(optimized)
            ahorro = size_antes - size_despues
            total_ahorrado += ahorro
            
            self.stdout.write(f"  ✓ Imagen de {img.producto.nombre}: {size_antes}KB → {size_despues}KB (Ahorro: {ahorro}KB)")
            
            if not dry_run:
                img.imagen = optimized
                img.save()
        
        # Optimizar imagen de la tienda
        self.stdout.write('\n🏪 Optimizando configuración de tienda...')
        store_configs = StoreConfiguration.objects.filter(main_image__isnull=False).exclude(main_image='')
        for config in store_configs:
            size_antes = get_image_size_kb(config.main_image)
            optimized = optimize_image(config.main_image, max_width=2000, max_height=1200, quality=85)
            size_despues = get_image_size_kb(optimized)
            ahorro = size_antes - size_despues
            total_ahorrado += ahorro
            
            self.stdout.write(f"  ✓ {config.title}: {size_antes}KB → {size_despues}KB (Ahorro: {ahorro}KB)")
            
            if not dry_run:
                config.main_image = optimized
                config.save()
        
        # Resumen
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS(f'✅ Optimización completada'))
        self.stdout.write(self.style.SUCCESS(f'📊 Espacio total ahorrado: {total_ahorrado:.2f} KB ({total_ahorrado/1024:.2f} MB)'))
        
        if dry_run:
            self.stdout.write(self.style.WARNING('⚠️  Nada fue guardado (modo DRY-RUN)'))
            self.stdout.write(self.style.WARNING('Ejecuta sin --dry-run para guardar los cambios'))
