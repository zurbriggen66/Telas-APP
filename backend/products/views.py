from rest_framework.decorators import api_view, parser_classes, action
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
from .models import Producto, StoreConfiguration, Categoria, ProductoImagen, PagoProcesado, Pedido, PedidoItem
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

def enviar_plantilla_whatsapp(numero_destino, nombre_plantilla, parametros):
    """
    Envía un mensaje de WhatsApp usando una plantilla preaprobada de Meta.
    'parametros' es una lista con los valores para {{1}}, {{2}}, {{3}}, {{4}}, {{5}}, {{6}}.
    """
    WHATSAPP_TOKEN = "EAAbwNepQP9IBRf4KaswYuGSUhFriYrnLnSpxbvoUSUyMFhGPXFydbGFZCgpXwvPVrZAgZAoma0LUYiGAdJgmZBa73gNh4ZBE1jo9TO58VJT71WEhkRm3LLikh28ssAwPsPbJuwssgZC3JtrKxGq8Ktd1Uj35VxjghQPdejplchk5ZAj7HQeadx43tzxCNrkmAZDZD"
    TELEFONO_ID = "1025878943952615"
    
    url = f"https://graph.facebook.com/v18.0/{TELEFONO_ID}/messages"
    
    # Mapeamos los strings de python al formato JSON requerido por Meta
    componentes_parametros = [{"type": "text", "text": valor} for valor in parametros]

    data = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": str(numero_destino),
        "type": "template",
        "template": {
            "name": nombre_plantilla,
            "language": {
                "code": "es_AR"  # Cambiar a "es" si en Meta figura sin el región-tag
            },
            "components": [
                {
                    "type": "body",
                    "parameters": componentes_parametros
                }
            ]
        }
    }
    
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        print(f"✅ Plantilla '{nombre_plantilla}' enviada correctamente a {numero_destino}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Error crítico al enviar Plantilla de WhatsApp: {e}")
        try:
            print(f"Detalle devuelto por Meta: {response.text}")
        except NameError:
            pass
        return False


# =========================================================================
#  2. VIEWSET PARA EL ADMIN/DASHBOARD (MANEJO MANUAL DE PEDIDOS)
# =========================================================================
class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all().order_by('-fecha_creacion')
    serializer_class = PedidoSerializer

    @action(detail=True, methods=['post'])
    def aprobar_transferencia(self, request, pk=None):
        pedido = self.get_object()
        
        if pedido.estado == 'Esperando_Transferencia':
            pedido.estado = 'Aprobado'
            pedido.save()
            
            # Correo de confirmación al cliente
            try:
                asunto_cliente = "¡Tu transferencia fue recibida! Pedido Aprobado 🧵✨"
                mensaje_cliente = (
                    f"¡Hola {pedido.nombre_cliente}!\n\n"
                    f"Hemos confirmado la recepción de tu transferencia por ${pedido.total}.\n"
                    f"Tu pedido #{pedido.id} ya está aprobado y comenzaremos a prepararlo.\n\n"
                    f"Detalle de las telas:\n{pedido.detalle_items}\n"
                    f"📍 Modalidad: {pedido.direccion_envio}\n\n"
                    f"Pronto nos comunicaremos para coordinar el envío.\n\n"
                    f"¡Gracias por elegir Telas APP!"
                )
                send_mail(asunto_cliente, mensaje_cliente, settings.EMAIL_HOST_USER, [pedido.email_cliente], fail_silently=False)
            except Exception as e:
                print(f"⚠️ Error al enviar correo de aprobación: {e}")

            # Alerta WhatsApp al dueño avisando que él mismo o un admin procesó la aprobación
            try:
                datos_plantilla = [
                    str(pedido.nombre_cliente),
                    str(pedido.telefono_cliente or 'No especificado'),
                    str(pedido.email_cliente),
                    str(pedido.detalle_items),
                    str(pedido.total),
                    f"PROCESADO MANUALMENTE - {pedido.direccion_envio}"
                ]
                enviar_plantilla_whatsapp("543544630650", "confirmacion_venta", datos_plantilla)
            except Exception as e_wpp:
                print(f"⚠️ Error al enviar WhatsApp en aprobación manual: {e_wpp}")

            return Response({"mensaje": "Pedido aprobado correctamente"}, status=status.HTTP_200_OK)
        
        return Response({"error": "El pedido no está esperando transferencia"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def cancelar_transferencia(self, request, pk=None):
        pedido = self.get_object()
        
        if pedido.estado == 'Esperando_Transferencia':
            pedido.estado = 'Cancelado'
            pedido.save()
            
            # Devolvemos el stock de las telas reservadas al cancelar
            for item in pedido.items.all():
                producto = item.producto
                if producto:
                    producto.stock_metros += item.cantidad_metros
                    producto.save()

            return Response({"mensaje": "Pedido cancelado y stock devuelto exitosamente"}, status=status.HTTP_200_OK)
        
        return Response({"error": "El pedido no está esperando transferencia"}, status=status.HTTP_400_BAD_REQUEST)


# =========================================================================
#  3. VISTA PARA CREAR EL PEDIDO DESDE EL CHECKOUT DE REACT
# =========================================================================
class CrearPedidoView(APIView):
    def post(self, request):
        try:
            cart_items = request.data.get('items', [])
            payer_data = request.data.get('payer', {}) 
            metodo_pago = request.data.get('metodo_pago', 'Mercado Pago')

            if not cart_items:
                return Response({"error": "El carrito está vacío"}, status=status.HTTP_400_BAD_REQUEST)

            # 1. Calcular el total del pedido
            total = Decimal('0.00')
            for item in cart_items:
                total += Decimal(str(item.get('precio_por_metro', 0))) * Decimal(str(item.get('cantidad', 1)))

            estado_inicial = 'Esperando_Transferencia' if metodo_pago == 'Transferencia' else 'Pendiente'

            # 2. Bloque atómico (Base de datos segura y control de concurrencia)
            with transaction.atomic():
                pedido = Pedido.objects.create(
                    nombre_cliente=f"{payer_data.get('nombre', '')} {payer_data.get('apellido', '')}".strip() or "Cliente",
                    email_cliente=payer_data.get('email', ''),
                    telefono_cliente=payer_data.get('telefono', ''),
                    direccion_envio=payer_data.get('direccion_envio', 'No especificado'),
                    total=total,
                    metodo_pago=metodo_pago,
                    estado=estado_inicial
                )

                detalle_productos_mail = ""

                for item in cart_items:
                    producto_id = item.get('id')
                    cantidad_solicitada = Decimal(str(item.get('cantidad', 0)))
                    precio_unitario = Decimal(str(item.get('precio_por_metro', 0)))

                    producto = Producto.objects.select_for_update().get(id=producto_id)

                    if producto.stock_metros < cantidad_solicitada:
                        raise ValueError(f"Stock insuficiente para la tela: {producto.nombre}. Disponible: {producto.stock_metros}m")

                    producto.stock_metros -= cantidad_solicitada
                    producto.save()

                    PedidoItem.objects.create(
                        pedido=pedido,
                        producto=producto,
                        nombre_producto=producto.nombre,
                        cantidad_metros=cantidad_solicitada,
                        precio_unitario=precio_unitario
                    )

                    detalle_productos_mail += f"• {producto.nombre}: {cantidad_solicitada} metros\n"

                pedido.detalle_items = detalle_productos_mail
                pedido.save()

            # --- BIFURCACIÓN DE NOTIFICACIONES SEGÚN EL PAGO ---
            if metodo_pago == 'Transferencia':
                try:
                    # Mail descriptivo al cliente con CBU
                    asunto_cliente = "Tu pedido está reservado 🧵✨ - Detalles de Transferencia"
                    mensaje_cliente = (
                        f"¡Hola {pedido.nombre_cliente}!\n\nHemos registrado tu pedido #{pedido.id} correctamente.\n"
                        f"Hemos reservado tus telas por un plazo de 24 horas. Para completar la compra, realiza la transferencia:\n\n"
                        f"💰 Total a transferir: ${pedido.total}\n"
                        f"🏦 CBU: O123456789012345678901\n"
                        f"📌 Alias: TELAS.APP.CBA\n"
                        f"👤 Titular: Ignacio Zurbriggen\n\n"
                        f"📍 Modalidad: {pedido.direccion_envio}\n\n"
                        f"Detalle de tu reserva:\n{pedido.detalle_items}\n"
                        f"Una vez realizada la transferencia, envíanos el comprobante respondiendo a este mail.\n\n"
                        f"¡Muchas gracias!"
                    )
                    send_mail(asunto_cliente, mensaje_cliente, settings.EMAIL_HOST_USER, [pedido.email_cliente], fail_silently=False)
                    
                    # Alerta formateada para la plantilla de WhatsApp del dueño
                    datos_plantilla = [
                        str(pedido.nombre_cliente),
                        str(pedido.telefono_cliente or 'No especificado'),
                        str(pedido.email_cliente),
                        f"⚠️ TRANSF. PENDIENTE:\n{pedido.detalle_items}",
                        str(pedido.total),
                        str(pedido.direccion_envio)
                    ]
                    enviar_plantilla_whatsapp("543544630650", "confirmacion_venta", datos_plantilla)
                    
                except Exception as e_notif:
                    print(f"⚠️ Error en notificaciones de transferencia: {e_notif}")

                return Response({
                    "status": "awaiting_transfer",
                    "pedido_id": pedido.id,
                    "total": float(pedido.total),
                    "mensaje": "Pedido reservado con éxito. Esperando transferencia."
                }, status=status.HTTP_201_CREATED)

            elif metodo_pago == 'Mercado Pago':
                sdk = mercadopago.SDK("APP_USR-1917487181339285-051122-426205322cae03264b84dd8070b963b0-3151002850")
                items_for_mp = []

                for item in cart_items:
                    items_for_mp.append({
                        "id": str(item.get('id', '1')),
                        "title": str(item.get('nombre', 'Corte de Tela')),
                        "quantity": int(item.get('cantidad', 1)),
                        "unit_price": float(item.get('precio_por_metro', 0)),
                        "currency_id": "ARS",
                    })

                ngrok_url = "https://elvia-uncited-humbly.ngrok-free.dev"

                preference_data = {
                    "items": items_for_mp,
                    "payer": {
                        "name": payer_data.get('nombre', ''),
                        "surname": payer_data.get('apellido', ''),
                        "email": payer_data.get('email', ''), 
                        "identification": {"type": "DNI", "number": str(payer_data.get('dni', ''))}
                    },
                    "metadata": {
                        "pedido_id": pedido.id,
                        "email_contacto": pedido.email_cliente,
                        "telefono_contacto": pedido.telefono_cliente,
                        "nombre_contacto": pedido.nombre_cliente
                    },
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
                
                return Response({
                    "status": "redirect_mp",
                    "pedido_id": pedido.id,
                    "preference_id": preference_response["response"]['id']
                }, status=status.HTTP_201_CREATED)

        except ValueError as ve:
            return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Error interno del servidor: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =========================================================================
#  4. WEBHOOKS Y REDIRECTS DE MERCADO PAGO
# =========================================================================
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
                    
                    metadata = payment.get("metadata", {})
                    pedido_id = metadata.get("pedido_id")

                    if pedido_id:
                        try:
                            pedido = Pedido.objects.get(id=pedido_id)
                            
                            if pedido.estado != 'Aprobado':
                                pedido.estado = 'Aprobado'
                                pedido.mp_id = payment_id
                                pedido.save()

                                # Correos informativos automáticos
                                try:
                                    asunto_cliente = "¡Tu pago fue aprobado! Gracias por elegir Telas APP 🧵✨"
                                    mensaje_cliente = f"¡Hola! Muchas gracias por tu compra.\n\nTu pago por ${pedido.total} ha sido procesado con éxito mediante Mercado Pago.\n\nDetalle de las telas:\n{pedido.detalle_items}\nNos comunicaremos pronto para coordinar el envío."
                                    send_mail(asunto_cliente, mensaje_cliente, settings.EMAIL_HOST_USER, [pedido.email_cliente], fail_silently=False)

                                    asunto_dueno = f"🚀 ¡NUEVA VENTA MP! - ${pedido.total} (Pedido #{pedido.id})"
                                    mensaje_dueno = f"¡Hola! Tienes una nueva venta aprobada vía Mercado Pago.\n\n💰 Monto: ${pedido.total}\n👤 Cliente: {pedido.nombre_cliente}\n📦 Detalle:\n{pedido.detalle_items}"
                                    send_mail(asunto_dueno, mensaje_dueno, settings.EMAIL_HOST_USER, [settings.EMAIL_HOST_USER], fail_silently=False)
                                except Exception as e_mail:
                                    print(f"⚠️ Error al enviar correos: {e_mail}")

                                # Disparo automático de la plantilla de WhatsApp al dueño
                                try:
                                    detalle_envio = getattr(pedido, 'direccion_envio', 'No especificado')

                                    datos_plantilla = [
                                        str(pedido.nombre_cliente),                         # {{1}}
                                        str(pedido.telefono_cliente or 'No especificado'),  # {{2}}
                                        str(pedido.email_cliente),                          # {{3}}
                                        str(pedido.detalle_items),                          # {{4}}
                                        str(pedido.total),                                  # {{5}}
                                        str(detalle_envio)                                  # {{6}}
                                    ]
                                    
                                    enviar_plantilla_whatsapp("543544630650", "confirmacion_venta", datos_plantilla)
                                    
                                except Exception as e_wpp:
                                    print(f"⚠️ Error al enviar WhatsApp: {e_wpp}")

                        except Pedido.DoesNotExist:
                            print(f"⚠️ Alerta: Se recibió pago de MP para el Pedido #{pedido_id} pero no existe en la BD.")

        return Response({"status": "recibido"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": "Fallo en webhook"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =========================================================================
#  5. CLASE DE PREFERENCIA INDEPENDIENTE DE MERCADO PAGO (OPCIONAL)
# =========================================================================
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

            ngrok_url = "https://elvia-uncited-humbly.ngrok-free.dev"

            preference_data = {
                "items": items_for_mp,
                "payer": {
                    "name": payer_data.get('nombre', ''),
                    "surname": payer_data.get('apellido', ''),
                    "email": payer_data.get('email', ''), 
                    "identification": {"type": "DNI", "number": str(payer_data.get('dni', ''))}
                },
                "metadata": {
                    "email_contacto": payer_data.get('email', ''),
                    "telefono_contacto": payer_data.get('telefono', ''),
                    "nombre_contacto": f"{payer_data.get('nombre', '')} {payer_data.get('apellido', '')}"
                },
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