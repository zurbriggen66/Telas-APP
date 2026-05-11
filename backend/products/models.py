from django.db import models

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