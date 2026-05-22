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
def optimize_store_images(sender, instance, **kwargs):
    """Optimiza TODAS las imágenes de la tienda antes de guardar"""
    # Banners
    if instance.banner_1: instance.banner_1 = optimize_image(instance.banner_1, max_width=2000, max_height=1200, quality=85)
    if instance.banner_2: instance.banner_2 = optimize_image(instance.banner_2, max_width=2000, max_height=1200, quality=85)
    if instance.banner_3: instance.banner_3 = optimize_image(instance.banner_3, max_width=2000, max_height=1200, quality=85)
    
    # Secundarias
    if instance.imagen_secundaria_1: instance.imagen_secundaria_1 = optimize_image(instance.imagen_secundaria_1, max_width=1200, max_height=1200, quality=85)
    if instance.imagen_secundaria_2: instance.imagen_secundaria_2 = optimize_image(instance.imagen_secundaria_2, max_width=1200, max_height=1200, quality=85)

class StoreConfiguration(models.Model):
    title = models.CharField(max_length=100, default="Bienvenido a Telas-APP")
    
    # --- Banners Principales ---
    banner_1 = models.ImageField(upload_to='banners/', verbose_name="Banner Principal 1", blank=True, null=True)
    banner_2 = models.ImageField(upload_to='banners/', verbose_name="Banner Principal 2", blank=True, null=True)
    banner_3 = models.ImageField(upload_to='banners/', verbose_name="Banner Principal 3", blank=True, null=True)


    # --- Configuración Logística (Envia.com) ---
    api_key_envia = models.CharField(
        max_length=255, 
        blank=True, 
        null=True, 
        verbose_name="Token API Envia.com",
        help_text="Pega aquí el Token generado en el panel de Envia.com"
    )
    peso_estandar = models.DecimalField(max_digits=5, decimal_places=2, default=1.50, verbose_name="Peso Estándar (kg)")
    largo_estandar = models.PositiveIntegerField(default=30, verbose_name="Largo Estándar (cm)")
    ancho_estandar = models.PositiveIntegerField(default=20, verbose_name="Ancho Estándar (cm)")
    alto_estandar = models.PositiveIntegerField(default=10, verbose_name="Alto Estándar (cm)")
    
    # --- Imágenes Secundarias ---
    imagen_secundaria_1 = models.ImageField(upload_to='banners/secundarias/', blank=True, null=True, verbose_name="Imagen Secundaria 1")
    imagen_secundaria_2 = models.ImageField(upload_to='banners/secundarias/', blank=True, null=True, verbose_name="Imagen Secundaria 2")
    
    # --- Logos ---
    logo = models.ImageField(upload_to='logos/', blank=True, null=True, verbose_name="Logo Principal")
    logo_desarrollador = models.ImageField(upload_to='logos/', blank=True, null=True, verbose_name="Logo Desarrollador")
    
    # --- Textos y Contacto ---
    instagram = models.CharField(max_length=100, blank=True, null=True, verbose_name="Usuario de Instagram")
    telefono = models.CharField(max_length=20, blank=True, null=True, verbose_name="Teléfono del Cliente")

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title

# --- NUEVO MODELO PARA COMISIONISTAS LOCALES ---
class TarifaLocal(models.Model):
    codigo_postal = models.CharField(max_length=10, unique=True, verbose_name="Código Postal")
    localidad = models.CharField(max_length=100, verbose_name="Nombre de la Localidad/Barrio")
    costo_envio = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Costo de Envío ($)")
    activo = models.BooleanField(default=True, verbose_name="Habilitar esta ruta")

    class Meta:
        verbose_name = "Tarifa de Comisionista Local"
        verbose_name_plural = "Tarifas de Comisionistas Locales"

    def __str__(self):
        return f"{self.localidad} (CP: {self.codigo_postal}) - ${self.costo_envio}"

class Categoria(models.Model):
    nombre = models.CharField(max_length=100, verbose_name="Nombre")
    descripcion = models.TextField(verbose_name="Descripción", blank=True, null=True)
    imagen = models.ImageField(upload_to='categorias/', verbose_name="Imagen", null=True, blank=True)
    
    # ⚠️ Eliminamos categoria_padre por completo

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"
        ordering = ['nombre']

    def __str__(self):
        return self.nombre

class Producto(models.Model):
    # ⚠️ Cambiamos a ManyToManyField. Nota que ahora es plural: "categorias"
    categorias = models.ManyToManyField(
        Categoria,
        related_name='productos',
        verbose_name="Categorías"
    )
    nombre = models.CharField(max_length=200, verbose_name="Nombre de la Tela")
    descripcion = models.TextField(verbose_name="Descripción")
    es_favorito = models.BooleanField(default=False, verbose_name="Tela Favorita/Destacada")
    
    precio_por_metro = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Precio por Metro")
    ancho_cm = models.PositiveIntegerField(verbose_name="Ancho (cm)", help_text="Ejemplo: 150, 180, 300")
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
    
# models.py (Actualizaciones sugeridas)

class Pedido(models.Model):
    ESTADOS = (
        ('Pendiente', 'Pendiente de Pago (MP)'),
        ('Esperando_Transferencia', 'Esperando Transferencia'),
        ('Aprobado', 'Pago Aprobado'),
        ('Cancelado', 'Cancelado / Expirado'),
        ('Despachado', 'Pedido Despachado'),
    )
    
    # Identificadores
    mp_id = models.CharField(max_length=100, null=True, blank=True, verbose_name="ID MercadoPago")
    
    # Datos del cliente (Agregamos nombre y teléfono que ya extraías en tu webhook)
    nombre_cliente = models.CharField(max_length=100, default="Cliente")
    email_cliente = models.EmailField()
    telefono_cliente = models.CharField(max_length=20, null=True, blank=True)

    # 👇 NUEVOS: Campos técnicos ocultos para la API de Envia.com
    envia_carrier = models.CharField(max_length=100, blank=True, null=True) # Ej: "correoargentino"
    envia_service = models.CharField(max_length=100, blank=True, null=True) # Ej: "estandar"

    # 👇 NUEVO CAMPO: Guardará la dirección o si retira en el local
    direccion_envio = models.CharField(max_length=255, null=True, blank=True, verbose_name="Método/Dirección de Envío")

    # 👇 Agregamos estos dos campos para tener el desglose claro
    costo_envio = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Costo de Envío Cobrado")
    tipo_envio = models.CharField(max_length=255, blank=True, null=True, verbose_name="Tipo de Envío (Local/Envia.com)")
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    url_etiqueta = models.URLField(blank=True, null=True) # Opcional, para que la puedas re-imprimir
    
    # Datos del pago
    total = models.DecimalField(max_digits=10, decimal_places=2)
    metodo_pago = models.CharField(max_length=50, default='Mercado Pago') # 'Mercado Pago' o 'Transferencia'
    estado = models.CharField(max_length=30, choices=ESTADOS, default='Pendiente')
    detalle_items = models.TextField(blank=True, null=True)
    # Comprobante opcional para que el cliente lo suba después (opcional pero muy útil)
    comprobante_transferencia = models.ImageField(upload_to='comprobantes/', null=True, blank=True)
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True) # Útil para saber cuándo lo aprobaste

    def __str__(self):
        return f"Pedido #{self.id} - {self.email_cliente} ({self.estado})"

# ⚠️ NUEVO MODELO CRÍTICO: Para poder manejar el stock dinámicamente
class PedidoItem(models.Model):
    pedido = models.ForeignKey(Pedido, related_name='items', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.SET_NULL, null=True) # SET_NULL por si borras la tela en un futuro
    nombre_producto = models.CharField(max_length=200) # Guardamos el nombre histórico
    cantidad_metros = models.DecimalField(max_digits=10, decimal_places=2)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.cantidad_metros}m de {self.nombre_producto} (Pedido #{self.pedido.id})"
    
