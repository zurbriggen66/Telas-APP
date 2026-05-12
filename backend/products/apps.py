from django.apps import AppConfig


class ProductsConfig(AppConfig):
    name = 'products'
    default_auto_field = 'django.db.models.BigAutoField'
    
    def ready(self):
        """Importar signals cuando la aplicación esté lista"""
        import products.models  # Esto carga los decoradores @receiver
