import os
import requests
from django.conf import settings

def enviar_notificacion_dueño(pedido, telefono_dueño):
    """
    Toma los datos del pedido y le dispara un WhatsApp libre al dueño del local.
    """
    api_url = os.environ.get("WA_API_URL")
    api_token = os.environ.get("WA_API_TOKEN")
    instancia = os.environ.get("WA_INSTANCE_NAME")
    
    # 1. Armamos el mensaje libremente con negritas (*) y cursivas (_)
    mensaje = f"""🚨 ¡NUEVA VENTA REGISTRADA! 🚨

👤 Cliente: {pedido.nombre_cliente}
📞 Teléfono: {pedido.telefono_cliente}
✉️ Email: {pedido.email_cliente}
git
🛒 Detalle del pedido:
{pedido.detalle_items}

💰 Total Cobrado: ${pedido.total}
📍 Envío/Retiro: {pedido.direccion_envio}

✅ Telas App - Notificación de sistema"""

    # 2. La URL exacta a la que le pegamos (formato estándar de Evolution API)
    url = f"{api_url}/message/sendText/{instancia}"
    
    # 3. Los encabezados con el token de seguridad
    headers = {
        "apikey": api_token,
        "Content-Type": "application/json"
    }
    
    # 4. El cuerpo del mensaje
    payload = {
        "number": telefono_dueño, # Formato internacional sin el '+' (ej: 5493544123456)
        "text": mensaje
    }

    # 5. Ejecutamos el envío
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status() # Verifica que la API haya respondido con un 200 OK
        return True
    except requests.exceptions.RequestException as e:
        print(f"Error al enviar el WhatsApp: {e}")
        return False