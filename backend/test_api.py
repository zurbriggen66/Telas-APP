import requests

# URL de tu endpoint local en Django
URL = "http://127.0.0.1:8000/api/cotizar-envio/"

print("=== INICIANDO PRUEBAS DE LOGÍSTICA HÍBRIDA ===\n")

# --- PRUEBA 1: Código Postal Local (Comisionista) ---
# Usamos el CP 2347 que acabas de registrar para San Guillermo
cp_local = {"codigo_postal": "2347"}
print(f"1. Probando destino local conocido (CP: 2347)...")

try:
    res_local = requests.post(URL, json=cp_local)
    print("Respuesta del servidor:")
    print(res_local.json())
except Exception as e:
    print(f"Error al conectar: {e}")

print("\n" + "-"*50 + "\n")

# --- PRUEBA 2: Código Postal Lejano (Envia.com) ---
# Usamos el CP 5000 (Córdoba) o 1000 (Buenos Aires) para forzar la consulta externa
cp_lejano = {"codigo_postal": "5000"} 
print(f"2. Probando destino de larga distancia (CP: 5000)...")

try:
    res_lejano = requests.post(URL, json=cp_lejano)
    print("Respuesta del servidor:")
    print(res_lejano.json())
except Exception as e:
    print(f"Error al conectar: {e}")