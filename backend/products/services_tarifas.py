# services_tarifas.py

# 1. AGRUPACIÓN DE PROVINCIAS (Origen: Córdoba)
ZONAS_LOGISTICAS = {
    'LOCAL': ['SF'], # Córdoba
    'REGIONAL': ['SF', 'BA', 'CABA', 'LP', 'SL', 'LR', 'CA', 'SE'], # Provincias limítrofes
    'NACIONAL_2': ['NQ', 'RN', 'CU', 'SC', 'TF'], # Patagonia (Costo extendido)
    # El resto caerá por defecto en NACIONAL_1
}

# 2. MATRIZ DE PRECIOS
# Si aumenta el correo, solo tocás los números de este diccionario y se actualiza en toda la web.
TARIFARIO = {
    'LOCAL': {
        'sucursal': 5650,
        'domicilio': 6000
    },
    'REGIONAL': {
        'sucursal': 5800,
        'domicilio': 7500
    },
    'NACIONAL_1': {
        'sucursal': 7200,
        'domicilio': 8900
    },
    'NACIONAL_2': {
        'sucursal': 9500,
        'domicilio': 11500
    }
}

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