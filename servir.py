#!/usr/bin/env python3
"""Publica «A jugar con las letras» en la red local.

  ./servir.py                 -> http://<ip-de-este-equipo>:8000
  ./servir.py --https         -> https://... (necesario para instalarla como app)
  ./servir.py --port 8080     -> otro puerto

Se detiene con Ctrl+C.
"""

import argparse
import functools
import http.server
import ipaddress
import os
import shutil
import socket
import ssl
import subprocess
import sys
import threading

RAIZ = os.path.dirname(os.path.abspath(__file__))
DIR_CERT = os.path.join(RAIZ, '.cert')


# ─────────────────────────── servidor ───────────────────────────

class Manejador(http.server.SimpleHTTPRequestHandler):
    """Sirve la carpeta del proyecto con los tipos MIME correctos."""

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
        '.json': 'application/json',
        '.webmanifest': 'application/manifest+json',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.css': 'text/css',
        '.html': 'text/html',
    }

    def guess_type(self, path):
        if os.path.basename(path) == 'manifest.json':
            return 'application/manifest+json'
        return super().guess_type(path)

    def end_headers(self):
        # El service worker se encarga de guardar la app; el navegador siempre
        # pregunta por si hemos cambiado algo.
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Service-Worker-Allowed', '/')
        super().end_headers()

    def log_message(self, formato, *args):
        if '--verboso' in sys.argv:
            super().log_message(formato, *args)


class Servidor(http.server.ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


# ─────────────────────────── red ───────────────────────────

def direcciones_locales():
    """Direcciones IPv4 de este equipo en la red local, sin la de loopback."""
    ips = []
    try:
        salida = subprocess.run(['hostname', '-I'], capture_output=True, text=True, timeout=5).stdout
        for trozo in salida.split():
            try:
                ip = ipaddress.ip_address(trozo)
            except ValueError:
                continue
            if ip.version == 4 and not ip.is_loopback and not ip.is_link_local:
                ips.append(str(ip))
    except Exception:
        pass
    if not ips:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(('8.8.8.8', 80))          # no envía nada, solo elige la ruta
            ips.append(s.getsockname()[0])
            s.close()
        except Exception:
            pass
    return ips


def nombres_locales():
    nombre = socket.gethostname()
    nombres = [nombre]
    if not nombre.endswith('.local'):
        nombres.append(nombre + '.local')       # funciona si hay avahi/mDNS
    return nombres


# ─────────────────────────── certificado ───────────────────────────

def preparar_certificado(ips, nombres):
    """Crea (si hace falta) un certificado propio para poder usar https."""
    cert = os.path.join(DIR_CERT, 'cert.pem')
    clave = os.path.join(DIR_CERT, 'key.pem')
    huella = os.path.join(DIR_CERT, 'para.txt')
    destinos = ','.join(
        ['IP:127.0.0.1', 'DNS:localhost']
        + [f'IP:{ip}' for ip in ips]
        + [f'DNS:{n}' for n in nombres]
    )

    if os.path.exists(cert) and os.path.exists(clave):
        anterior = open(huella).read().strip() if os.path.exists(huella) else ''
        if anterior == destinos:
            return cert, clave                  # ya vale para estas direcciones

    if not shutil.which('openssl'):
        sys.exit('Falta «openssl», necesario para crear el certificado de https.')

    os.makedirs(DIR_CERT, exist_ok=True)
    print('Creando un certificado propio para https…')
    orden = [
        'openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
        '-keyout', clave, '-out', cert, '-days', '825',
        '-subj', '/CN=A jugar con las letras',
        '-addext', f'subjectAltName={destinos}',
    ]
    res = subprocess.run(orden, capture_output=True, text=True)
    if res.returncode != 0:
        sys.exit('No se pudo crear el certificado:\n' + res.stderr)
    os.chmod(clave, 0o600)
    open(huella, 'w').write(destinos)
    return cert, clave


# ─────────────────────────── avisos ───────────────────────────

def aviso_cortafuegos(puerto):
    if not shutil.which('ufw'):
        return
    try:
        estado = subprocess.run(['ufw', 'status'], capture_output=True, text=True, timeout=5)
    except Exception:
        return
    texto = (estado.stdout or '') + (estado.stderr or '')
    if 'inactive' in texto or 'inactivo' in texto:
        return
    if str(puerto) in texto:
        return
    # O el cortafuegos está activo y sin regla, o no hemos podido consultarlo.
    print(f'  ⚠ Si desde otro aparato no se abre, permite el puerto en el cortafuegos:')
    print(f'      sudo ufw allow {puerto}/tcp comment "A jugar con las letras"\n')


def codigo_qr(url):
    if not shutil.which('qrencode'):
        return
    try:
        salida = subprocess.run(['qrencode', '-t', 'ANSIUTF8', '-m', '1', url],
                                capture_output=True, text=True, timeout=5)
        if salida.returncode == 0 and salida.stdout.strip():
            print(salida.stdout)
    except Exception:
        pass


# ─────────────────────────── principal ───────────────────────────

def main():
    sys.stdout.reconfigure(line_buffering=True)   # útil al ejecutarlo como servicio
    p = argparse.ArgumentParser(description='Publica la aplicación en la red local.')
    p.add_argument('--port', '-p', type=int, default=8000, help='puerto (por defecto 8000)')
    p.add_argument('--https', action='store_true',
                   help='usar https con un certificado propio (permite instalarla como app)')
    p.add_argument('--host', default='0.0.0.0', help='interfaz donde escuchar')
    p.add_argument('--verboso', action='store_true', help='mostrar cada petición')
    args = p.parse_args()

    ips = direcciones_locales()
    nombres = nombres_locales()
    esquema = 'https' if args.https else 'http'

    manejador = functools.partial(Manejador, directory=RAIZ)
    try:
        servidor = Servidor((args.host, args.port), manejador)
    except OSError as e:
        sys.exit(f'No se puede usar el puerto {args.port}: {e}\n'
                 f'Prueba con otro, por ejemplo:  ./servir.py --port {args.port + 1}')

    if args.https:
        cert, clave = preparar_certificado(ips, nombres)
        contexto = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        contexto.load_cert_chain(cert, clave)
        servidor.socket = contexto.wrap_socket(servidor.socket, server_side=True)

    urls = [f'{esquema}://{ip}:{args.port}/' for ip in ips]

    print('\n  ¡A jugar con las letras! — servidor en marcha 🎉\n')
    print(f'  En este equipo:   {esquema}://localhost:{args.port}/')
    for url in urls:
        print(f'  En la red local:  {url}')
    for nombre in nombres[1:]:
        print(f'                    {esquema}://{nombre}:{args.port}/   (si el aparato admite mDNS)')
    print()

    if urls:
        codigo_qr(urls[0])

    if args.https:
        print('  ⚠ El certificado es propio, no lo firma nadie: la primera vez el navegador')
        print('    avisará de que el sitio «no es seguro». Hay que aceptar y continuar.')
        print('    A cambio, se puede instalar como app y jugar sin conexión.\n')
    else:
        print('  ℹ Para poder instalarla en la tableta y jugar sin conexión, arráncala así:')
        print(f'      ./servir.py --https --port {args.port}\n')

    aviso_cortafuegos(args.port)
    print('  Para parar el servidor: Ctrl+C\n')

    hilo = threading.Thread(target=servidor.serve_forever, daemon=True)
    hilo.start()
    try:
        hilo.join()
    except KeyboardInterrupt:
        print('\n  Servidor detenido. ¡Hasta la próxima! 👋')
        servidor.shutdown()


if __name__ == '__main__':
    main()
