import requests
import os
from .models import TarifaLocal, StoreConfiguration

def calcular_costo_envio(codigo_postal_destino):
    """
    Calcula el costo de envío evaluando primero la tabla de comisionistas (TarifaLocal).
    Si no hay cobertura, consulta la API de Envia.com usando el empaque estándar.
    """
    
    # 1. Buscar en la base de datos de comisionistas locales
    tarifa_local = TarifaLocal.objects.filter(codigo_postal=codigo_postal_destino, activo=True).first()
    
    if tarifa_local:
        return {
            "error": False,
            "tipo": "Local",
            "proveedor": f"Comisionista ({tarifa_local.localidad})",
            "costo": float(tarifa_local.costo_envio)
        }

    # 2. Si no es local, buscamos las credenciales y medidas en StoreConfiguration
    config = StoreConfiguration.objects.filter(is_active=True).first()
    
    if not config or not config.api_key_envia:
        return {
            "error": True,
            "mensaje": "La configuración de envíos o el Token de Envia.com no están definidos en el panel."
        }

    # 3. Preparar la petición a la API de Envia.com
    # Usamos la variable de entorno, o por defecto la de pruebas si no la encuentra.
    base_url = os.environ.get('ENVIA_BASE_URL', 'https://api-test.envia.com')
    endpoint = f"{base_url}/ship/rate"
    
    headers = {
        "Authorization": f"Bearer {config.api_key_envia}",
        "Content-Type": "application/json"
    }

    # 4. Armar el JSON (Payload)
    payload = {
        "origin": {
            "name": config.title,
            "company": config.title,
            "email": "contacto@telasapp.com",
            "phone": config.telefono or "3510000000",
            "street": "Urquiza", 
            "number": "70",
            "district": "",
            "city": "San Guillermo",
            "state": "SF",
            "country": "AR",
            "postalCode": "2347", # ⚠️ IMPORTANTE: Cambiar por el CP real desde donde despacha tu cliente
            "reference": ""
        },
        "destination": {
            "name": "Cliente Web",
            "company": "",
            "email": "nachozubri15@gmail.com",
            "phone": "3562517046",
            "street": "Obispo Oro",
            "number": "344",
            "district": "",
            "city": "Cordoba",
            "state": "CB",  # 👇 ESTA ES LA CORRECCIÓN CLAVE
            "country": "AR",
            "postalCode": str(codigo_postal_destino),
            "reference": ""
        },
        "packages": [
            {
                "content": "Telas y Textiles",
                "amount": 1,
                "type": "box",
                "weight": float(config.peso_estandar),
                "insurance": 0,
                "declaredValue": 0,
                "weightUnit": "KG",
                "lengthUnit": "CM",
                "dimensions": {
                    "length": config.largo_estandar,
                    "width": config.ancho_estandar,
                    "height": config.alto_estandar
                }
            }
        ],
        "shipment": {
            "carrier": "correoargentino", # Vacio para que devuelva TODAS las opciones disponibles (Andreani, Correo Argentino, etc)
            "type": 1 
        }
    }

    # 5. Ejecutar la llamada a la API
    # 5. Ejecutar la llamada a la API
    try:
        response = requests.post(endpoint, json=payload, headers=headers)
        
        # 👇 NUEVO: Interceptamos si Envia devuelve un error antes de que Python explote
        if response.status_code != 200:
            print("\n--- 🚨 ERROR DE ENVIA.COM 🚨 ---")
            print(f"Status Code: {response.status_code}")
            print(f"Respuesta cruda: {response.text}")
            print("--------------------------------\n")
            return {
                "error": True, 
                "mensaje": f"Fallo al cotizar (HTTP {response.status_code}). Revisar consola de Django."
            }

        # Si llegamos acá, es porque Envia respondió OK (Status 200)
        response_data = response.json()

        if 'data' in response_data and response_data['data']:
            opciones_brutas = response_data['data']
            lista_opciones = []
            
            # Recorremos TODAS las opciones que nos da el correo
            for op in opciones_brutas:
                
                # 👇 AQUÍ VAN LOS PRINTS DE DIAGNÓSTICO 👇
                print("--- DATOS DE OPCIÓN DE ENVIA.COM ---")
                print(op)
                print("------------------------------------")
                # 👆 ------------------------------------ 👆

                lista_opciones.append({
                    "id": op.get('carrierId'),
                    "proveedor": op.get('carrierDescription', 'Correo Nacional'),
                    "servicio": op.get('serviceDescription', 'Estándar'),
                    "costo": float(op.get('totalPrice', 0)),
                    "tiempo_entrega": op.get('deliveryEstimate', 'Desconocido'),
                    
                    # Códigos técnicos para la etiqueta
                    "carrier_code": op.get('carrier', 'correoargentino').lower(),
                    "service_code": op.get('service', 'estandar').lower()
                })

            return {
                "error": False,
                "tipo": "Larga Distancia",
                "opciones": lista_opciones
            }

            
        else:
             return {"error": True, "mensaje": "Envia.com no devolvió opciones de correo.", "detalle": response_data}

    except Exception as e:
        return {"error": True, "mensaje": f"Error interno del servidor Django: {str(e)}"}