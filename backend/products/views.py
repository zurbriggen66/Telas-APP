from products.services_tarifas import TARIFARIO, ZONAS_LOGISTICAS
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Sum
from django.utils.timezone import now
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import DateRange, Metric, RunReportRequest
from .whatsapp import enviar_notificacion_dueño
from rest_framework.decorators import api_view, parser_classes, action, api_view, permission_classes    
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
import mercadopago
import requests
from rest_framework.permissions import AllowAny
from .services_correo import buscar_por_cp
import os
# revisar luego si todos los import son necesarios o si quedaron algunos de pruebas anteriores
from .models import Producto, StoreConfiguration, Categoria, ProductoImagen, PagoProcesado, Pedido, PedidoItem, TarifaLocal, Color, UsoTela
from .serializers import CategoriaSerializer, ProductoDesplegableSerializer, StoreConfigurationSerializer, Producto, UsoTelaSerializer, TarifaLocalSerializer
from .serializers import ProductoDesplegableSerializer, TarifaLocalSerializer, ColorSerializer, ProductoSerializer, ProductoImagenSerializer, PedidoSerializer
from decimal import Decimal
from rest_framework import status, viewsets, generics
from django.conf import settings
from rest_framework.views import APIView
from django.db import transaction
from django.shortcuts import redirect
from django.core.mail import send_mail
from .services_envia import buscar_sucursales_cercanas, calcular_costo_envio, rastrear_envios
from django.shortcuts import redirect, get_object_or_404
from django.db.models import Sum
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .services_envia import buscar_sucursales_cercanas, calcular_costo_envio, rastrear_envios
# ⚠️ IMPORTAMOS EL NUEVO MODELO 'Pedido'
from .models import Producto, StoreConfiguration, Categoria, ProductoImagen, PagoProcesado, Pedido, PedidoItem
from .serializers import CategoriaSerializer, ProductoDesplegableSerializer, StoreConfigurationSerializer, ProductoSerializer, ProductoImagenSerializer, PedidoSerializer, ColorSerializer
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .services_tarifas import determinar_zona, calcular_precio_envio

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
    
class UsoTelaViewSet(viewsets.ModelViewSet):
    queryset = UsoTela.objects.all().order_by('nombre')
    serializer_class = UsoTelaSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.prefetch_related('categorias', 'usos').all()
    serializer_class = ProductoSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        producto = Producto.objects.get(id=response.data['id'])
        
        # --- NUEVO: Failsafe para guardar categorías desde FormData ---
        categorias_ids = request.data.getlist('categorias')
        if categorias_ids:
            producto.categorias.set(categorias_ids)
        
        usos_ids = request.data.getlist('usos')
        if usos_ids:
            producto.usos.set(usos_ids)
            
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

        if 'usos' in request.data:
            if hasattr(request.data, 'getlist'):
                usos_ids = request.data.getlist('usos')
            else:
                usos_ids = request.data.get('usos', [])
            producto.usos.set(usos_ids)
            
        self._guardar_imagenes_galeria(request, producto)
        return response

    def _guardar_imagenes_galeria(self, request, producto):
        for key, file in request.FILES.items():
            if key.startswith('imagen_extra_'):
                ProductoImagen.objects.create(producto=producto, imagen=file)
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Leemos si la URL trae un filtro de color (ej: /api/productos/?color=3)
        color_id = self.request.query_params.get('color', None)
        uso_id = self.request.query_params.get('uso', None)
        
        if color_id:
            queryset = queryset.filter(color_id=color_id)

        if uso_id:
            queryset = queryset.filter(usos__id=uso_id)

        
            
        return queryset
    

# =========================================================================
#  VIEWSET PARA COLORES
# =========================================================================
class ColorViewSet(viewsets.ModelViewSet):
    queryset = Color.objects.all().order_by('nombre')
    serializer_class = ColorSerializer

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
                send_mail(asunto_cliente, mensaje_cliente, settings.DEFAULT_FROM_EMAIL, [pedido.email_cliente], fail_silently=False)
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
    
    @action(detail=True, methods=['post'])
    def marcar_enviado(self, request, pk=None):
        pedido = self.get_object()
        
        pedido.estado = 'Enviado'
        pedido.save()

        return Response({"mensaje": "Pedido marcado como enviado por comisionista"}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def despachar_pedido(self, request, pk=None):
        pedido = self.get_object()
        tracking_number = request.data.get('tracking_number')

        if not tracking_number:
            return Response({"error": "Debe proporcionar un número de seguimiento"}, status=status.HTTP_400_BAD_REQUEST)

        if pedido.estado == 'Aprobado' or pedido.estado == 'APROBADO':
            pedido.estado = 'Despachado'
            pedido.tracking_number = tracking_number
            pedido.save()

            try:
                asunto_cliente = f"📦 ¡Tu pedido ya fue despachado!"
                mensaje_cliente = (
                    f"¡Hola {pedido.nombre_cliente}!\n\n"
                    f"Te avisamos que tu pedido ya fue despachado y está en camino.\n\n"
                    f"Tu número de seguimiento es: {tracking_number}\n\n"
                    f"Ingresá al siguiente link y digitá el número de arriba para consultar el estado de tu envío en la página oficial de Correo Argentino:\n"
                    f"👉 https://www.correoargentino.com.ar/formularios/e-commerce\n\n"
                    f"Detalle de las telas enviadas:\n{pedido.detalle_items}\n\n"
                    f"📍 Destino: {pedido.direccion_envio}\n\n"
                    f"¡Gracias por elegir Telas APP!"
                )
                send_mail(asunto_cliente, mensaje_cliente, settings.DEFAULT_FROM_EMAIL, [pedido.email_cliente], fail_silently=False)
            except Exception as e:
                print(f"⚠️ Error al enviar correo de despacho: {e}")

            return Response({"mensaje": "Pedido despachado y correo enviado exitosamente"}, status=status.HTTP_200_OK)
        
        return Response({"error": "El pedido debe estar Aprobado para poder despacharse."}, status=status.HTTP_400_BAD_REQUEST)
    
    

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

            # 1. Calcular el total de las telas
            total = Decimal('0.00')
            for item in cart_items:
                total += Decimal(str(item.get('precio_por_metro', 0))) * Decimal(str(item.get('cantidad', 1)))
            
            # 👇 CORRECCIÓN: Calcular y sumar el costo de envío al total final
            costo_envio_calculado = Decimal(str(request.data.get('costo_envio', 0)))
            total += costo_envio_calculado

            estado_inicial = 'Esperando_Transferencia' if metodo_pago == 'Transferencia' else 'Pendiente'

            # 2. Bloque atómico (Base de datos segura y control de concurrencia)
            with transaction.atomic():
                pedido = Pedido.objects.create(
                    nombre_cliente=f"{payer_data.get('nombre', '')} {payer_data.get('apellido', '')}".strip() or "Cliente",
                    email_cliente=payer_data.get('email', ''),
                    telefono_cliente=payer_data.get('telefono', ''),
                    direccion_envio=payer_data.get('direccion_envio', 'No especificado'),
                    
                    # 👇 NUEVOS CAMPOS: Ahora sí guardamos los datos logísticos 👇
                    ciudad=payer_data.get('ciudad', ''),
                    provincia=payer_data.get('provincia', ''),
                    codigo_postal=payer_data.get('codigoPostal', ''), # Ojo: React lo manda como codigoPostal (con P mayúscula)
                    calle=payer_data.get('calle', ''),
                    numero=payer_data.get('numero', ''),
                    # 👆 FIN NUEVOS CAMPOS 👆

                    total=total,
                    metodo_pago=metodo_pago,
                    estado=estado_inicial,
                    costo_envio=costo_envio_calculado,
                    tipo_envio=request.data.get('tipo_envio', 'Retiro en Local'),
                    envia_carrier=request.data.get('envia_carrier'),
                    envia_service=request.data.get('envia_service')
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


            config = StoreConfiguration.objects.filter(is_active=True).first()
            correo_dueño = config.correo_contacto if config and config.correo_contacto else 'registrar correo en configuración'
            alias_banco = config.alias_bancario if config and config.alias_bancario else '--'

            if metodo_pago == 'Transferencia':
                try:
                    # 1. Mail descriptivo al cliente con CBU
                    asunto_cliente = "Tu pedido está reservado ✨ - Detalles de Transferencia"
                    mensaje_cliente = (
                        f"¡Hola {pedido.nombre_cliente}!\n\nHemos registrado tu pedido correctamente.\n"
                        f"Hemos reservado tus pedido por un plazo de 24 horas. Para completar la compra, realiza la transferencia y envianos el comprobante para acelerar su despacho...:\n\n"
                        f"💰 Total a transferir: ${pedido.total}\n"
                        f"🏦 CBU: O123456789012345678901\n"
                        f"📌 Alias: {alias_banco}\n"
                        f"👤 Titular: Ignacio Zurbriggen\n\n"
                        f"📍 Modalidad: {pedido.direccion_envio}\n\n"
                        f"Detalle de tu reserva:\n{pedido.detalle_items}\n"
                        f"Una vez realizada la transferencia, envíanos el comprobante respondiendo a este mail.\n\n"
                        f"¡Muchas gracias!"
                    )
                    send_mail(asunto_cliente, mensaje_cliente, settings.DEFAULT_FROM_EMAIL, [pedido.email_cliente], fail_silently=False)
                    
                    # 2. Mail de aviso para ti (el dueño)
                    asunto_dueno = f"TENES UN NUEVO PEDIDO - Transferencia Pendiente (# {pedido.id})"
                    mensaje_dueno = (
                        f"¡Hola! Tienes un nuevo pedido en la web.\n\n"
                        f"👤 Cliente: {pedido.nombre_cliente}\n"
                        f"📧 Email: {pedido.email_cliente}\n"
                        f"📱 Teléfono: {pedido.telefono_cliente}\n"
                        f"💰 Total: ${pedido.total}\n\n"
                        f"📦 Detalle de telas:\n{pedido.detalle_items}\n"
                        f"📍 Envío/Retiro: {pedido.direccion_envio}\n\n"
                        f"El pedido está a la espera de que el cliente transfiera."
                    )
                    send_mail(asunto_dueno, mensaje_dueno, settings.DEFAULT_FROM_EMAIL, [correo_dueño], fail_silently=False)

                    # 3. Alerta formateada para la plantilla de WhatsApp del dueño
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

                # Respuesta a React de Transferencia
                return Response({
                    "status": "awaiting_transfer",
                    "pedido_id": pedido.id,
                    "total": float(pedido.total),
                    "mensaje": "Pedido reservado con éxito. Esperando transferencia."
                }, status=status.HTTP_201_CREATED)

            elif metodo_pago == 'Mercado Pago':

               # Buscamos la configuración activa en la base de datos
                config = StoreConfiguration.objects.filter(is_active=True).first()
            
            # Verificamos que exista y tenga el token guardado
                if not config or not config.mp_access_token:
                    return Response({"error": "La tienda no ha vinculado su cuenta de Mercado Pago."}, status=status.HTTP_400_BAD_REQUEST) 
                # Inicializamos el SDK con el token dinámico del cliente
                sdk = mercadopago.SDK(config.mp_access_token)

                items_for_mp = []
               
                for item in cart_items:
                    items_for_mp.append({
                        "id": str(item.get('id', '1')),
                        "title": str(item.get('nombre', 'Corte de Tela')),
                        "quantity": int(item.get('cantidad', 1)),
                        "unit_price": float(item.get('precio_por_metro', 0)),
                        "currency_id": "ARS",
                    })

                # 👇 ¡OJO! Opcionalmente, puedes añadir el costo de envío como un ítem extra en MP para que quede desglosado
                if costo_envio_calculado > 0:
                    items_for_mp.append({
                        "id": "envio",
                        "title": "Costo de Envío",
                        "quantity": 1,
                        "unit_price": float(costo_envio_calculado),
                        "currency_id": "ARS",
                    })

                ngrok_url = "https://untouching-morally-amaya.ngrok-free.dev"

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

                                config = StoreConfiguration.objects.filter(is_active=True).first()
                                correo_dueño = config.correo_contacto if config and config.correo_contacto else 'nachozubri15@gmail.com'

                                # Correos informativos automáticos
                                try:
                                    asunto_cliente = "¡Tu pago fue aprobado! Gracias por elegir Telas APP 🧵✨"
                                    mensaje_cliente = f"¡Hola! Muchas gracias por tu compra.\n\nTu pago por ${pedido.total} ha sido procesado con éxito mediante Mercado Pago.\n\nDetalle de las telas:\n{pedido.detalle_items}\nNos comunicaremos pronto para coordinar el envío."
                                    send_mail(asunto_cliente, mensaje_cliente, settings.DEFAULT_FROM_EMAIL, [pedido.email_cliente], fail_silently=False)

                                    asunto_dueno = f"🚀 ¡NUEVA VENTA MP! - ${pedido.total} (Pedido #{pedido.id})"
                                    mensaje_dueno = f"¡Hola! Tienes una nueva venta aprobada vía Mercado Pago.\n\n💰 Monto: ${pedido.total}\n👤 Cliente: {pedido.nombre_cliente}\n📦 Detalle:\n{pedido.detalle_items}"
                                    send_mail(asunto_dueno, mensaje_dueno, settings.DEFAULT_FROM_EMAIL, [correo_dueño], fail_silently=False)
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

            ngrok_url = "https://untouching-morally-amaya.ngrok-free.dev"

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
        
# FILTRO PARA DESPLEGAR PRODUCTOS EN ORDEN ALFABÉTICO (POR EJEMPLO, EN UN SELECT DE REACT)
class ProductoAZList(generics.ListAPIView):
    # Traemos todos los productos ordenados de la A a la Z
    queryset = Producto.objects.all().order_by('nombre')
    serializer_class = ProductoDesplegableSerializer



# ==========================================
# 1. BÚSQUEDA DE SUCURSALES
# ==========================================
@api_view(['POST'])
def obtener_sucursales_api(request):
    try:
        # Ahora request.data funciona perfecto gracias a @api_view
        cp_cliente = request.data.get('codigo_postal')
        provincia_destino = request.data.get('provincia', 'Desconocida')
        
        # Buscamos en el diccionario
        sucursales_crudas = buscar_por_cp(cp_cliente)
        
        # EL FILTRO: Si el CP no existe en tu archivo, cortamos acá
        if not sucursales_crudas:
            return Response({
                'error': True, 
                'mensaje': 'Lo sentimos, no realizamos envíos a localidades con ese código postal.'
            }, status=404)

        # Calculamos la tarifa de la sucursal
        costo_envio = calcular_precio_envio(provincia_destino, 'sucursal')
        
        sucursales_formateadas = []
        for suc in sucursales_crudas:
            sucursales_formateadas.append({
                'id_unico': f"ca_suc_{suc.get('codigo_sucursal', '00')}", 
                'nombre': suc.get('descripcion', 'Sucursal'), 
                'proveedor': 'Correo Argentino',
                'costo': costo_envio,
                'tiempo_entrega': '3 a 5 días hábiles',
                'codigo_postal': cp_cliente,
                'direccion': suc.get('descripcion', ''), 
                'localidad': suc.get('provincia', ''),
                'carrier_code': 'correoargentino',
                'service_code': 'estandar'
            })
            
        return Response({'sucursales': sucursales_formateadas}, status=200)
        
    except Exception as e:
        print(f"Error en sucursales: {e}") # Esto imprimirá el error real en tu consola de VSC si vuelve a fallar
        return Response({'error': True, 'mensaje': 'Error interno del servidor.'}, status=500)

# ==========================================
# 2. COTIZACIÓN A DOMICILIO
# ==========================================
@api_view(['POST'])
def cotizar_envio_api(request):
    codigo_postal = request.data.get('codigo_postal')
    provincia_destino = request.data.get('provincia', 'Desconocida')
    
    if not codigo_postal:
        return Response({"error": True, "mensaje": "Debes enviar un código postal."}, status=400)
        
    # EL FILTRO: Verificamos si el CP está mapeado, aunque sea para envío a domicilio
    sucursales_crudas = buscar_por_cp(codigo_postal)
    if not sucursales_crudas:
        return Response({
            "error": True, 
            "mensaje": "Lo sentimos, no realizamos envíos a localidades con ese código postal."
        }, status=404)
        
    # Calculamos la tarifa usando tu motor
    zona = determinar_zona(provincia_destino)
    costo_domicilio = calcular_precio_envio(zona, 'domicilio')
    
    opciones = [
        {
            "proveedor": "Correo Argentino",
            "servicio": "Envío a Domicilio Clásico",
            "costo": costo_domicilio,
            "tiempo_entrega": "3 a 6 días hábiles",
            "carrier_code": "correoargentino",
            "service_code": "estandar"
        }
    ]

    return Response({"opciones": opciones}, status=200)
def api_estadisticas(request):
    # 1. Filtramos solo los pedidos consolidados (ventas reales)
    pedidos_exitosos = Pedido.objects.filter(estado__in=['Aprobado', 'Despachado', 'APROBADO', 'ENVIADO'])
    
    # 2. Ingresos Totales Históricos
    ingresos_totales = pedidos_exitosos.aggregate(Sum('total'))['total__sum'] or 0.00
    
    # 3. Separación Local vs Web (usando el email que definiste en tu view)
    ventas_locales_qs = pedidos_exitosos.filter(email_cliente="local@telasapp.com")
    ventas_web_qs = pedidos_exitosos.exclude(email_cliente="local@telasapp.com")
    
    ventas_locales_count = ventas_locales_qs.count()
    ventas_web_count = ventas_web_qs.count()

    # 4. Construcción del Historial de los últimos 12 meses
    fecha_actual = now()
    meses_historial = []
    nombres_meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    
    for i in range(11, -1, -1):
        m = fecha_actual.month - i
        y = fecha_actual.year
        while m <= 0:
            m += 12
            y -= 1
            
        pedidos_mes = pedidos_exitosos.filter(fecha_creacion__year=y, fecha_creacion__month=m)
        total_mes = pedidos_mes.aggregate(Sum('total'))['total__sum'] or 0
        ventas_mes = pedidos_mes.count()
        
        meses_historial.append({
            "id_mes": f"{y}-{m:02d}", # Ej: "2026-06"
            "mes_label": f"{nombres_meses[m-1]} {y}", # Ej: "Jun 2026"
            "ingresos": float(total_mes),
            "ventas": ventas_mes
        })

    # 5. Consultar Google Analytics 4
    def obtener_visitas_ga4():
        try:
            PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID")
            if not PROPERTY_ID or "GOOGLE_APPLICATION_CREDENTIALS" not in os.environ:
                return 0
            
            client = BetaAnalyticsDataClient()
            request = RunReportRequest(
                property=f"properties/{PROPERTY_ID}",
                dimensions=[],
                metrics=[Metric(name="activeUsers")],
                date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
            )
            response = client.run_report(request)
            if response.rows:
                return int(response.rows[0].metric_values[0].value)
            return 0
        except Exception as e:
            print(f"Error GA4: {e}")
            return 0

    data = {
        "ingresos_totales": float(ingresos_totales),
        "historial_12_meses": meses_historial,
        "mes_actual": meses_historial[-1], # El último de la lista es el mes en curso
        "origen_ventas": [
            {"name": "Local", "value": ventas_locales_count},
            {"name": "Web", "value": ventas_web_count}
        ],
        "analytics": {
            "visitas_30_dias": obtener_visitas_ga4()
        }
    }
    
    return JsonResponse(data)


@csrf_exempt  # Para evitar problemas de bloqueo de seguridad desde React
def eliminar_pedido_api(request, pedido_id):
    if request.method == 'DELETE':
        pedido = get_object_or_404(Pedido, id=pedido_id)
        pedido.delete()
        return JsonResponse({"message": "Pedido eliminado correctamente"}, status=200)
    
    return JsonResponse({"error": "Método no permitido"}, status=405)

class ConfirmarPedidoView(APIView):
    def post(self, request):
        # ... acá ya tenés tu código donde validás el pago y guardás el pedido ...
        
        # Simulamos que ya buscaste el pedido en tu base de datos:
        pedido = Pedido.objects.get(id=request.data['pedido_id'])
        pedido.estado = 'Aprobado'
        pedido.save()

        # 👇 ACÁ EJECUTAMOS EL WHATSAPP 👇
        # Obtenemos el número del dueño (lo podés traer de un modelo Tienda o de una variable de entorno)
        import os
        telefono_del_dueño = os.environ.get("NUMERO_DUENO", "5493544630650") 
        
        enviar_notificacion_dueño(pedido, telefono_del_dueño)

        return Response({"mensaje": "Pedido confirmado y alerta de WhatsApp enviada al dueño."})

        
    
# ventas en local

class RegistrarVentaLocalView(APIView):
    # 🔒 Opcional: Podés agregar permission_classes = [IsAdminUser] si querés protegerlo
    
    def post(self, request):
        try:
            producto_id = request.data.get('producto_id')
            cantidad_metros = Decimal(str(request.data.get('metros', 0)))
            precio_cobrado = Decimal(str(request.data.get('precio_cobrado', 0)))

            if not producto_id or cantidad_metros <= 0:
                return Response({"error": "Datos de venta inválidos."}, status=status.HTTP_400_BAD_REQUEST)

            # Usamos un bloque atómico para evitar problemas si venden en simultáneo en la web
            with transaction.atomic():
                # select_for_update bloquea la fila temporalmente para asegurar el stock
                producto = Producto.objects.select_for_update().get(id=producto_id)

                if producto.stock_metros < cantidad_metros:
                    return Response({
                        "error": f"Stock insuficiente para {producto.nombre}. Disponible: {producto.stock_metros}m"
                    }, status=status.HTTP_400_BAD_REQUEST)

                # 1. Descontamos el stock físico
                producto.stock_metros -= cantidad_metros
                producto.save()

                # 2. Registramos la venta como un Pedido Aprobado para mantener tus estadísticas al día
                pedido = Pedido.objects.create(
                    nombre_cliente="Cliente Local",
                    email_cliente="local@telasapp.com", # Email ficticio obligatorio en tu modelo
                    telefono_cliente="-",
                    direccion_envio="Venta directa en Mostrador",
                    total=precio_cobrado,
                    metodo_pago="Efectivo/Tarjeta Local",
                    estado="Aprobado",
                    tipo_envio="Retiro en Local",
                    detalle_items=f"• {producto.nombre}: {cantidad_metros} metros (Venta Local)\n"
                )

                # 3. Guardamos el item histórico
                PedidoItem.objects.create(
                    pedido=pedido,
                    producto=producto,
                    nombre_producto=producto.nombre,
                    cantidad_metros=cantidad_metros,
                    precio_unitario=(precio_cobrado / cantidad_metros) if cantidad_metros > 0 else 0
                )

            # ✨ Respuesta limpia: Sin llamadas a send_mail ni plantillas de WhatsApp
            return Response({
                "success": True, 
                "mensaje": "Venta registrada y stock actualizado con éxito.",
                "nuevo_stock": float(producto.stock_metros)
            }, status=status.HTTP_201_CREATED)

        except Producto.DoesNotExist:
            return Response({"error": "El producto seleccionado no existe."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Error interno: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# =========================================================================
#  NUEVA FUNCIÓN — Agregala al final de tu views.py
#  La URL ya está definida: path('envio/sucursales/', views.obtener_sucursales_api, ...)
# =========================================================================



# =========================================================================
#  IMPORTANTE: También revisá tu services_envia.py
#  La función calcular_costo_envio() tiene que devolver carrier_code
#  y service_code en cada opción. Si no los devuelve, el payload al
#  crear el pedido va a mandar 'correoargentino' y 'estandar' por default.
#
#  El response esperado de calcular_costo_envio() es algo así:
#  {
#    "opciones": [
#      {
#        "proveedor": "Correo Argentino",
#        "servicio": "Estándar a Sucursal",   <-- contiene "sucursal"
#        "costo": 3200,
#        "tiempo_entrega": "3-5 días hábiles",
#        "carrier_code": "correoargentino",    <-- necesario
#        "service_code": "estandar"            <-- necesario
#      },
#      {
#        "proveedor": "Correo Argentino",
#        "servicio": "Estándar a Domicilio",   <-- contiene "domicilio"
#        "costo": 4100,
#        ...
#      }
#    ]
#  }
# =========================================================================

class RastrearPedidoView(APIView):
    def get(self, request, tracking_number):
        # Llamamos a nuestra función genérica pasándole el tracking como lista
        resultado = rastrear_envios([tracking_number])
        
        if resultado["error"]:
            return Response({"error": resultado["mensaje"]}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(resultado["data"], status=status.HTTP_200_OK)
    
class TarifaLocalViewSet(viewsets.ModelViewSet):
    queryset = TarifaLocal.objects.all().order_by('localidad')
    serializer_class = TarifaLocalSerializer



def calcular_envio(request):
    cp_cliente = "5800" # Esto vendría del request de tu frontend
    
    sucursales_disponibles = buscar_por_cp(cp_cliente)
    
    if not sucursales_disponibles:
        return print("No hay sucursales para este Código Postal.")
        
    for sucursal in sucursales_disponibles:
        print(f"Encontrada: {sucursal['descripcion']} en {sucursal['provincia']}")
        
    # Aquí continuás con tu lógica para asignar el precio según la zona...




# services_tarifas.py
def determinar_zona(codigo_provincia):
    """
    Recibe el código de la provincia (ej: 'SF', 'BA') y devuelve la Zona Logística.
    """
    prov_limpia = str(codigo_provincia).upper().strip()
    
    if prov_limpia in ZONAS_LOGISTICAS['LOCAL']:
        return 'LOCAL'
    elif prov_limpia in ZONAS_LOGISTICAS['REGIONAL']:
        return 'REGIONAL'
    elif prov_limpia in ZONAS_LOGISTICAS['NACIONAL_2']:
        return 'NACIONAL_2'
    else:
        # Todo lo que no sea local, limítrofe o sur profundo, es Nacional 1 (Mendoza, Salta, etc.)
        return 'NACIONAL_1'

def calcular_precio_envio(codigo_provincia, tipo_entrega):
    """
    Busca en la matriz el precio exacto. 
    tipo_entrega debe ser 'sucursal' o 'domicilio'.
    """
    # 1. Averiguamos la zona
    zona = determinar_zona(codigo_provincia)
    
    # 2. Buscamos los precios de esa zona (Si falla, cobramos la más cara por seguridad)
    precios_zona = TARIFARIO.get(zona, TARIFARIO['NACIONAL_2'])
    
    # 3. Retornamos el costo según sea sucursal o domicilio
    return precios_zona.get(tipo_entrega, precios_zona['domicilio'])


@api_view(['GET'])
@permission_classes([AllowAny]) # Dejamos que MP entre sin pedirle token previo
def mercadopago_callback(request):
    # 1. Atrapamos el código y el ID de la tienda (que mandaremos desde React)
    codigo_autorizacion = request.GET.get('code')
    tienda_id = request.GET.get('state') 

    # URL final a donde mandamos al cliente cuando termina todo el proceso
    URL_FRONTEND = 'https://www.modaytelas.com.ar/dashboard/inicio' 

    if not codigo_autorizacion:
        return redirect(f"{URL_FRONTEND}?error=auth_failed")

    # 2. Le pedimos el Token definitivo a Mercado Pago
    url_token = "https://api.mercadopago.com/oauth/token"
    
    data = {
        "client_secret": settings.MP_CLIENT_SECRET,
        "client_id": settings.MP_APP_ID,
        "grant_type": "authorization_code",
        "code": codigo_autorizacion,
        # ESTA URL TIENE QUE SER EXACTAMENTE LA MISMA QUE PUSIMOS EN MP
        "redirect_uri": "https://ignaciozurbriggen.pythonanywhere.com/api/mercadopago/callback/"
    }

    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "accept": "application/json"
    }

    response = requests.post(url_token, data=data, headers=headers)
    mp_data = response.json()

    # 3. Si todo salió bien, guardamos en la base de datos
    if response.status_code == 200:
        try:
            tienda = StoreConfiguration.objects.get(id=tienda_id)
            tienda.mp_access_token = mp_data.get('access_token')
            tienda.mp_refresh_token = mp_data.get('refresh_token')
            tienda.mp_user_id = mp_data.get('user_id')
            tienda.save()
            
            # ¡Éxito! Redirigimos al cliente a su panel
            return redirect(f"{URL_FRONTEND}?success=mp_vinculado")
        except StoreConfiguration.DoesNotExist:
            return redirect(f"{URL_FRONTEND}?error=tienda_no_encontrada")
    else:
        # Si MP rechaza el código, lo mandamos de vuelta con error
        print("Error de Mercado Pago:", mp_data) # Ideal para mirar en la terminal si algo falla
        return redirect(f"{URL_FRONTEND}?error=token_failed")
    

@api_view(['GET'])
def api_dashboard_inicio(request):
    hoy = timezone.now().date()
    
    # 1. ESTADÍSTICAS SUPERIORES
    total_productos = Producto.objects.count()
    pedidos_pendientes_count = Pedido.objects.filter(
        estado__in=['Pendiente', 'PENDIENTE', 'Esperando_Transferencia']
    ).count()
    
    pedidos_exitosos = Pedido.objects.filter(
        estado__in=['Aprobado', 'APROBADO', 'Despachado', 'Enviado', 'ENVIADO']
    )
    
    # Ventas totales del mes
    pedidos_este_mes = pedidos_exitosos.filter(fecha_creacion__year=hoy.year, fecha_creacion__month=hoy.month)
    ventas_totales_mes = pedidos_este_mes.aggregate(Sum('total'))['total__sum'] or 0.00

    # 2. DATOS PARA EL GRÁFICO
    ventas_por_dia = []
    for d in range(1, hoy.day + 1):
        pedidos_del_dia = pedidos_exitosos.filter(
            fecha_creacion__year=hoy.year,
            fecha_creacion__month=hoy.month,
            fecha_creacion__day=d
        )
        total_dia = pedidos_del_dia.aggregate(Sum('total'))['total__sum'] or 0.00
        
        ventas_por_dia.append({
            "fecha": f"{d:02d}/{hoy.month:02d}",
            "total": float(total_dia)
        })

    # 3. PEDIDOS A DESPACHAR (Solo Aprobados listos para armar)
    pedidos_a_despachar = Pedido.objects.filter(
        estado__in=['Aprobado', 'APROBADO']
    ).order_by('-fecha_creacion')[:5]
    
    a_despachar_lista = [{
        "cliente": p.nombre_cliente,
        "fecha": p.fecha_creacion.strftime("%d %b"),
        "envio": p.tipo_envio if p.tipo_envio else "Retiro / Envío", # Para mostrar cómo entregarlo
        "total": float(p.total)
    } for p in pedidos_a_despachar]

    # 4. PRODUCTOS CON STOCK BAJO
    stock_bajo = Producto.objects.filter(stock_metros__lt=10).order_by('stock_metros')[:4]
    stock_bajo_lista = [{
        "id": p.id,
        "nombre": p.nombre,
        "stock": float(p.stock_metros),
        "precio": float(p.precio_por_metro) if p.precio_por_metro else 0 
    } for p in stock_bajo]

    return Response({
        "stats": {
            "productos": total_productos,
            "pedidos_pendientes": pedidos_pendientes_count,
            "ventas_totales": float(ventas_totales_mes),
        },
        "grafico": ventas_por_dia,
        "a_despachar": a_despachar_lista, # Cambiamos el nombre de la variable
        "stock_bajo": stock_bajo_lista
    })


