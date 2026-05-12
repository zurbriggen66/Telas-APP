from django.db import models
from django.db.models.signals import pre_save
from django.dispatch import receiver
from .image_utils import optimize_image


@receiver(pre_save, sender='products.Categoria')
def optimize_categoria_image(sender, instance, **kwargs):
    """Optimiza la imagen de categoría antes de guardar"""
    if instance.imagen:
        instance.imagen = optimize_image(instance.imagen, max_width=500, max_height=500, quality=85)


@receiver(pre_save, sender='products.Producto')
def optimize_producto_image(sender, instance, **kwargs):
    """Optimiza la imagen principal del producto antes de guardar"""
    if instance.imagen:
        instance.imagen = optimize_image(instance.imagen, max_width=1000, max_height=1000, quality=85)


@receiver(pre_save, sender='products.ProductoImagen')
def optimize_producto_galeria_image(sender, instance, **kwargs):
    """Optimiza las imágenes de galería antes de guardar"""
    if instance.imagen:
        instance.imagen = optimize_image(instance.imagen, max_width=800, max_height=800, quality=85)


@receiver(pre_save, sender='products.StoreConfiguration')
def optimize_store_banner_image(sender, instance, **kwargs):
    """Optimiza la imagen principal de la tienda antes de guardar"""
    if instance.main_image:
        instance.main_image = optimize_image(instance.main_image, max_width=2000, max_height=1200, quality=85)


class StoreConfiguration(models.Model):
    title = models.CharField(max_length=100, default="Bienvenido a Telas-APP")
    main_image = models.ImageField(upload_to='banners/', verbose_name="Imagen Principal")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class Categoria(models.Model):
    nombre = models.CharField(max_length=100, verbose_name="Nombre")
    descripcion = models.TextField(verbose_name="Descripción", blank=True, null=True)
    imagen = models.ImageField(upload_to='categorias/', verbose_name="Imagen", null=True, blank=True)
    
    # Este campo es la clave para manejar Subcategorías en el mismo modelo
    categoria_padre = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subcategorias',
        verbose_name="Categoría Padre",
        help_text="Dejar en blanco si es una categoría principal. Seleccionar una si es subcategoría."
    )

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"
        ordering = ['nombre']

    def __str__(self):
        # Para que en el admin de Django se vea claro: "Gamuza > Gamuzado Premium"
        if self.categoria_padre:
            return f"{self.categoria_padre.nombre} > {self.nombre}"
        return self.nombre


class Producto(models.Model):
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        related_name='productos',
        verbose_name="Categoría / Subcategoría"
    )
    nombre = models.CharField(max_length=200, verbose_name="Nombre de la Tela")
    descripcion = models.TextField(verbose_name="Descripción")
    
    # El precio en telas generalmente se maneja por metro lineal
    precio_por_metro = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Precio por Metro")
    
    # Dimensiones propias de la tela
    ancho_cm = models.PositiveIntegerField(
        verbose_name="Ancho (cm)", 
        help_text="Ejemplo: 150, 180, 300"
    )
    
    # El stock de la tela en metros. Usamos DecimalField porque se pueden vender fracciones (ej: 1.5 metros)
    stock_metros = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        verbose_name="Stock disponible (Metros)",
        help_text="Cantidad de metros de largo disponibles en el rollo."
    )
    
    imagen = models.ImageField(upload_to='productos/', verbose_name="Imagen Principal", blank=True, null=True)

    class Meta:
        verbose_name = "Tela / Producto"
        verbose_name_plural = "Telas / Productos"
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.ancho_cm}cm ancho) - Stock: {self.stock_metros}m"


class ProductoImagen(models.Model):
    producto = models.ForeignKey(
        Producto, 
        on_delete=models.CASCADE, 
        related_name='imagenes_galeria'
    )
    imagen = models.ImageField(upload_to='productos/galeria/', verbose_name="Imagen de Galería")

    class Meta:
        verbose_name = "Imagen de Producto"
        verbose_name_plural = "Imágenes de Producto"

    def __str__(self):
        return f"Imagen galería de {self.producto.nombre}"      
    

class PagoProcesado(models.Model):
    pago_id = models.CharField(max_length=100, unique=True)
    fecha_procesado = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.pago_id
    
class Pedido(models.Model):
    ESTADOS = (
        ('Aprobado', 'Aprobado'),
        ('Pendiente', 'Pendiente'),
        ('Cancelado', 'Cancelado'),
    )
    mp_id = models.CharField(max_length=100, null=True, blank=True)
    email_cliente = models.EmailField()
    total = models.DecimalField(max_digits=10, decimal_places=2)
    metodo_pago = models.CharField(max_length=50, default='Mercado Pago')
    estado = models.CharField(max_length=20, choices=ESTADOS, default='Aprobado')
    detalle_items = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pedido #{self.id} - {self.email_cliente}"