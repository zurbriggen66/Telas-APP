from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
import mercadopago
import requests
from decimal import Decimal
from rest_framework import status, viewsets
from django.conf import settings
from rest_framework.views import APIView
from django.db import transaction
from django.shortcuts import redirect
from django.core.mail import send_mail

# ⚠️ IMPORTAMOS EL NUEVO MODELO 'Pedido'
from .models import Producto, StoreConfiguration, Categoria, ProductoImagen, PagoProcesado, Pedido
from .serializers import CategoriaSerializer, StoreConfigurationSerializer, ProductoSerializer, ProductoImagenSerializer, PedidoSerializer

@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser])
def get_main_banner(request):
    config = StoreConfiguration.objects.filter(is_active=True).first()
    if request.method == 'GET':
        if config:
            serializer = StoreConfigurationSerializer(config, context={'request': request})
            return Response(serializer.data)
        return Response({"error": "No hay configuración activa"}, status=status.HTTP_404_NOT_FOUND)
    elif request.method == 'POST':
        if config:
            serializer = StoreConfigurationSerializer(config, data=request.data, partial=True, context={'request': request})
        else:
            serializer = StoreConfigurationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(is_active=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CategoriaViewSet(viewsets.ModelViewSet):
    # ⚠️ Quitamos el select_related('categoria_padre')
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.prefetch_related('categorias').all()
    serializer_class = ProductoSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        producto = Producto.objects.get(id=response.data['id'])
        
        # --- NUEVO: Failsafe para guardar categorías desde FormData ---
        categorias_ids = request.data.getlist('categorias')
        if categorias_ids:
            producto.categorias.set(categorias_ids)
            
        self._guardar_imagenes_galeria(request, producto)
        return response

    def update(self, request, *args, **kwargs):
        producto_id = kwargs.get('pk')
        
        # --- CORRECCIÓN: Adaptamos para que acepte tanto FormData como JSON puro ---
        if hasattr(request.data, 'getlist'):
            # Si viene desde el formulario con imágenes (FormData)
            imagenes_a_eliminar = request.data.getlist('eliminar_imagenes')
        else:
            # Si viene desde un clic rápido como el de Favoritos (JSON)
            imagenes_a_eliminar = request.data.get('eliminar_imagenes', [])
            
        if imagenes_a_eliminar:
            ProductoImagen.objects.filter(id__in=imagenes_a_eliminar, producto_id=producto_id).delete()
            
        response = super().update(request, *args, **kwargs)
        producto = self.get_object()
        
        # --- CORRECCIÓN: Lo mismo para las categorías ---
        if 'categorias' in request.data:
            if hasattr(request.data, 'getlist'):
                categorias_ids = request.data.getlist('categorias')
            else:
                categorias_ids = request.data.get('categorias', [])
            producto.categorias.set(categorias_ids) 
            
        self._guardar_imagenes_galeria(request, producto)
        return response

    def _guardar_imagenes_galeria(self, request, producto):
        for key, file in request.FILES.items():
            if key.startswith('imagen_extra_'):
                ProductoImagen.objects.create(producto=producto, imagen=file)

# --- NUEVO VIEWSET PARA PEDIDOS ---
class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all().order_by('-fecha_creacion')
    serializer_class = PedidoSerializer

class MercadoPagoPreferenceView(APIView):
    def post(self, request):
        try:
            sdk = mercadopago.SDK("APP_USR-1917487181339285-051122-426205322cae03264b84dd8070b963b0-3151002850")
            cart_items = request.data.get('items', [])
            payer_data = request.data.get('payer', {}) 
            items_for_mp = []

            for item in cart_items:
                items_for_mp.append({
                    "id": str(item.get('id', '1')),
                    "title": str(item.get('nombre', 'Corte de Tela')),
                    "quantity": int(item.get('cantidad', 1)),
                    "unit_price": float(item.get('precio_por_metro', 0)),
                    "currency_id": "ARS",
                })

            # TU URL DE NGROK AQUÍ
            ngrok_url = "https://elvia-uncited-humbly.ngrok-free.dev"

            preference_data = {
                "items": items_for_mp,
                "payer": {
                    "name": payer_data.get('nombre', ''),
                    "surname": payer_data.get('apellido', ''),
                    "email": payer_data.get('email', ''), 
                    "identification": {"type": "DNI", "number": str(payer_data.get('dni', ''))}
                },
                "metadata": {"email_contacto": payer_data.get('email', ''),
                             "telefono_contacto": payer_data.get('telefono', ''),
                            "nombre_contacto": f"{payer_data.get('nombre', '')} {payer_data.get('apellido', '')}"},
                "back_urls": {
                    "success": f"{ngrok_url}/api/mercadopago/success/", 
                    "failure": "http://localhost:5173/checkout",
                    "pending": "http://localhost:5173/checkout"
                },
                "auto_return": "approved",
                "binary_mode": True,
                "notification_url": f"{ngrok_url}/api/mercadopago/webhook/"
            }

            preference_response = sdk.preference().create(preference_data)
            
            if preference_response["status"] >= 400:
                return Response(preference_response["response"], status=status.HTTP_400_BAD_REQUEST)
            return Response({'id': preference_response["response"]['id']}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def success_redirect(request):
    return redirect("http://localhost:5173/success")

@api_view(['POST'])
def webhook_mercadopago(request):
    try:
        data = request.data
        topic = request.GET.get('topic') or request.GET.get('type') or data.get('type')
        payment_id = request.GET.get('data.id') or request.GET.get('id') or data.get('data', {}).get('id')
        
        if topic == 'payment' and payment_id:
            if PagoProcesado.objects.filter(pago_id=payment_id).exists():
                return Response({"status": "ya procesado"}, status=status.HTTP_200_OK)

            sdk = mercadopago.SDK("APP_USR-1917487181339285-051122-426205322cae03264b84dd8070b963b0-3151002850")
            payment_info = sdk.payment().get(payment_id)
            
            if payment_info["status"] == 200:
                payment = payment_info["response"]
                if payment["status"] == "approved":
                    PagoProcesado.objects.create(pago_id=payment_id)
                    items_comprados = payment.get("additional_info", {}).get("items", [])
                    payer_info = payment.get("payer", {})
                    metadata = payment.get("metadata", {})
                    
                    email_cliente = metadata.get("email_contacto")
                    if not email_cliente:
                        email_cliente = payer_info.get("email", "No especificado")
                        
                    monto_total = payment.get("transaction_amount", 0)
                    detalle_productos_mail = ""
                    
                    with transaction.atomic():
                        for item in items_comprados:
                            try:
                                producto = Producto.objects.select_for_update().get(id=item.get("id"))
                                metros = Decimal(str(item.get("quantity", 0)))
                                if producto.stock_metros >= metros:
                                    producto.stock_metros -= metros
                                    producto.save()
                                    detalle_productos_mail += f"• {item.get('title')}: {metros} metros\n"
                            except Producto.DoesNotExist:
                                continue

                    # ---------------------------------------------------------
                    # 📝 GUARDAR EL PEDIDO EN LA BASE DE DATOS
                    # ---------------------------------------------------------
                    try:
                        Pedido.objects.create(
                            mp_id=payment_id,
                            email_cliente=email_cliente,
                            total=monto_total,
                            metodo_pago="Mercado Pago",
                            estado="Aprobado",
                            detalle_items=detalle_productos_mail
                        )
                        print("📦 Historial: Nuevo pedido guardado en la BD.")
                    except Exception as e:
                        print(f"⚠️ Error al guardar el pedido: {e}")

                    # ---------------------------------------------------------
                    # 📧 ENVÍO DE CORREOS
                    # ---------------------------------------------------------
                    try:
                        asunto_cliente = "¡Tu pago fue aprobado! Gracias por elegir Telas APP 🧵✨"
                        mensaje_cliente = f"¡Hola! Muchas gracias por tu compra en Telas APP.\n\nTu pago por ${monto_total} ha sido procesado y aprobado con éxito mediante Mercado Pago.\n\nAquí tienes el detalle de las telas que reservaste:\n{detalle_productos_mail}\nNos pondremos en contacto contigo a la brevedad a este mismo correo o a tu número de contacto para coordinar los detalles del envío.\n\n¡Gracias por confiar en nosotros y a crear cosas hermosas!\nEl equipo de Telas APP."
                        send_mail(asunto_cliente, mensaje_cliente, settings.EMAIL_HOST_USER, [email_cliente], fail_silently=False)

                        asunto_dueno = f"🚀 ¡NUEVA VENTA! - ${monto_total} (Pago #{payment_id})"
                        mensaje_dueno = f"¡Hola Nacho! Tienes una nueva venta aprobada en Telas APP. 🎉\n\n💰 Monto cobrado: ${monto_total}\n👤 Email del cliente: {email_cliente}\n🆔 ID de Operación MP: {payment_id}\n\n📦 Detalle del pedido (A preparar los cortes!):\n{detalle_productos_mail}\nRecuerda contactar al cliente para coordinar el método de entrega."
                        send_mail(asunto_dueno, mensaje_dueno, settings.EMAIL_HOST_USER, [settings.EMAIL_HOST_USER], fail_silently=False)
                    except Exception as e_mail:
                        print(f"⚠️ Error al enviar correos: {e_mail}")

                    # ---------------------------------------------------------
                    # 📱 ENVÍO DE WHATSAPP AL DUEÑO (NUEVO)
                    # ---------------------------------------------------------
                    try:
                        # Rescatamos los datos nuevos de la metadata
                        telefono_cliente = metadata.get("telefono_contacto", "No especificado")
                        nombre_cliente = metadata.get("nombre_contacto", "Cliente")

                        # Armamos el texto con formato para WhatsApp (negritas con *)
                        mensaje_wpp = (
                            f"🚨 ¡NUEVA VENTA APROBADA!\n\n"
                            f"👤 Cliente: {nombre_cliente}\n"
                            f"📞 Teléfono: {telefono_cliente}\n"
                            f"✉️ Email: {email_cliente}\n\n"
                            f"🛒 Detalle del pedido:\n{detalle_productos_mail}\n"
                            f"💰 Total: ${monto_total}\n"
                            f"🆔 ID MP: {payment_id}"
                        )

                        #Llamamos a la función:
                        # Reemplaza con el número real de Nacho con código de país
                        numero_nacho = "5493562517046" 
                        enviar_mensaje_whatsapp(numero_nacho, mensaje_wpp)
                        
                        print("📲 Intento de envío de WhatsApp procesado.")
                    except Exception as e_wpp:
                        print(f"⚠️ Error al enviar WhatsApp: {e_wpp}")

        return Response({"status": "recibido"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": "Fallo en webhook"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#vies#
def enviar_mensaje_whatsapp(numero_destino, mensaje_texto):
    # ⚠️ REEMPLAZA ESTAS DOS VARIABLES CON TUS DATOS DE META ⚠️
    # Lo ideal es que luego las pases a tu archivo .env y uses settings.WHATSAPP_TOKEN
    WHATSAPP_TOKEN = "EAAbwNepQP9IBRUJ9g5JZAJCPUzoQD8aVH5mS2OfXLyINo1ZCmrv0HhYbc4z401xUEmG2fvN7eRczIJAwMjuXF2UJ1tZABjEH7kLWRvb4LIycrlUtbwZBNZAdUopvjNrPWhcykvVBtzaBmUKxpQZC89Vl3608Vn4YGY61KLpSU47BPML61ibPoZAA7COYtl6cScliaz2FP9IX3lu0aggumWnCtgJCyT46KNL7hULxhZAVkqE6f1BZCVdluP9ZBXvG1nZBKjWsUYZBNTcHs5PJAaDwENm8"
    TELEFONO_ID = "1101551966368735"
    
    # URL de la API de Graph de Meta (versión 18.0 o la que estés usando)
    url = f"https://graph.facebook.com/v18.0/{TELEFONO_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Estructura obligatoria que pide Meta
    data = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": str(numero_destino), # Aseguramos que sea string
        "type": "text",
        "text": {
            "preview_url": False,
            "body": mensaje_texto
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status() # Lanza un error si el status code no es 200
        print("✅ Mensaje de WhatsApp enviado correctamente a", numero_destino)
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Error crítico al enviar WhatsApp: {e}")
        if response is not None:
            print(f"Detalle de Meta: {response.text}")
        return False