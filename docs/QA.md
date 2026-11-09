# QA — Cuenta Clara

Fecha: 9 de noviembre de 2026 (America/Lima). Entorno real: macOS ARM64, Node 20.20.2, npm 10.8.2, MongoDB Community 8.0.34, mongosh 2.14.0.

## Base y configuración comprobadas

- Servicio existente: `/opt/homebrew/opt/mongodb-community@8.0/bin/mongod --config /opt/homebrew/etc/mongod.conf`, puerto 27017, bind loopback. No se reinstaló ni alteró su configuración.
- `hello` en 27017: `isWritablePrimary: true`, sin `setName`: **standalone**.
- Seed real: 3 cuentas y 3 depósitos de apertura, conexión cerrada correctamente.
- Replica set de QA separado `rs0`, puerto 27018, datos temporales en `/private/tmp/cuenta-bancaria-rs`. `hello` y tests confirmaron modo transaccional. No utiliza los datos de Homebrew.
- API real en `http://localhost:3000`; Vite en `http://localhost:5173`.

## Resultados automatizados

| Comprobación | Resultado ejecutado |
| --- | --- |
| `server: npm test` (MongoDB standalone real) | **75 tests, 75 pass, 0 fail, 0 skipped** |
| Integración contra replica set: `TEST_MONGODB_URI='mongodb://127.0.0.1:27018/?replicaSet=rs0' npm run test:integration` | **52 tests, 50 pass, 0 fail, 2 skipped**; los dos skips prueban exclusivamente la compensación/bloqueo standalone |
| `server: npm run seed` | Exit 0; Luis 2500.00, Ana 1800.00, Carlos 900.00 |
| `server: npm run smoke` contra servidor HTTP real | Exit 0; **6/6**: health, consulta, depósito, retiro, transferencia e historial |
| `client: npm test` | **3 archivos, 21 tests aprobados**, 0 fallos |
| `client: npm run build` | Exit 0; Vite 8.3.6, **25 módulos** transformados, sin warnings |
| `server: npm audit` | **0 vulnerabilidades** |
| `client: npm audit` | **0 vulnerabilidades** |

Los tests backend usan bases aleatorias desechables con prefijo `cuenta_bancaria_test_` y limpieza protegida por coincidencia exacta. Smoke crea/elimina solo sus propias cuentas temporales. La base de demostración no es la base de tests.

## Alcance backend

Health, cuenta existente/inexistente/malformada; depósitos exactos; montos ausentes/cero/negativos/texto/null/booleano/subcentavo; retiros válidos, saldo exacto e insuficiente; transferencias y sus dos participantes; cuenta propia/inexistente; historial con tres tipos, orden descendente y estado vacío; códigos HTTP; JSON inválido, límite de cuerpo, campos extra e inyección de identificadores objeto; CORS; validaciones de modelos y cuenta única.

Concurrencia: 20 retiros simultáneos de S/10 contra S/100: 10 aceptados, 10 rechazados y saldo 0. Quince transferencias de S/10 contra S/100: 10 aceptadas y 5 rechazadas; total conservado. Se prueban overflow destino, rollback de origen y fallo de historial para las tres operaciones. En standalone se simulan también fallo de compensación y resultado incierto de red; se comprueba bloqueo 503.

Los mensajes `REQUEST_FAILED` y `CONSISTENCY_REVIEW_REQUIRED` durante las pruebas son fallos inyectados deliberadamente; no son fallos de la suite.

## Alcance frontend

Carga inicial y estado vacío; loading y formularios deshabilitados; depósito/retiro/transferencia refrescan saldo e historial sin recargar; perspectiva receptora al cambiar cuenta; validaciones visibles; origen excluido de destinos; error del servidor conserva monto; doble submit produce una sola llamada; recuperación con Actualizar; fallo del refresco tras escritura informa éxito aplicado y bloquea formularios; cambio de cuenta limpia valores; envío por teclado; servicio API y errores HTTP/red; formato exacto en el máximo entero seguro.

## QA visual y recorrido real

Ejecutado con Safari y Chrome nativos mediante automatización de interfaz, conectado a Express y MongoDB reales.

| Caso | Evidencia observada |
| --- | --- |
| Carga inicial | Luis, cuenta 001-000001, saldo S/2,500.00 y depósito de apertura |
| Depósito S/15.90 | S/2,515.90, mensaje de éxito y nuevo movimiento, sin recarga |
| Retiro S/5.90 | S/2,510.00, mensaje de éxito y nuevo retiro, sin recarga |
| Transferencia S/10 a Ana | Luis S/2,500.00; movimiento enviado hacia Ana |
| Cambio a Ana | Saldo S/1,810.00; misma transferencia como recibida desde Luis |
| Fondos insuficientes | Retiro S/999999 rechazado; saldo anterior conservado; mensaje visible |
| Validación de campo vacío por teclado | Enter sobre Depositar muestra “Ingresa un monto mayor que cero.” |
| Foco y teclado | Tab desde monto enfoca Depositar; contorno teal visible en captura inspeccionada |
| Escritorio | Tres columnas de operaciones y resumen legible; captura CSS 1280 px |
| Tablet | Chrome responsive **820 px**, dos columnas; tercer formulario en fila siguiente |
| Móvil | Chrome responsive **360 px**, una columna; se recorrieron formularios e historial; sin recortes observados |
| Consola | Se detectó favicon faltante (404), se añadió SVG y después se observó consola sin errores de aplicación; permanece la sugerencia informativa React DevTools |

Capturas reales: [escritorio](capturas/escritorio-1280.png) (2560×3064, DPR 2; viewport CSS 1280) y [móvil](capturas/mobile-360.png) (720×5488, DPR 2; viewport CSS 360). Las capturas completas guardadas fueron inspeccionadas en el recorrido; no son mockups.

Loading, bloqueo de operación y error de refresco se validaron de manera automatizada en React; no se afirma haber capturado visualmente cada estado transitorio de red. No hubo auditoría con lector de pantalla ni dispositivos físicos móviles.

## Avisos y limitaciones

- **No bloqueante:** instalación informa deprecación de `whatwg-encoding@3.1.1`, dependencia de desarrollo transitiva de jsdom 26.1.0. No es una vulnerabilidad reportada por npm audit. No se forzaron cambios mayores.
- **No bloqueante del entorno:** `npm ci` del cliente informó un script de instalación opcional de `fsevents@2.3.3` no cubierto por `allowScripts`. No se modificó la política npm del usuario ni se aprobaron scripts globalmente. Instalación, tests y build finalizaron correctamente.
- Build: ningún warning bloqueante ni no bloqueante emitido por Vite.
- Topología principal standalone: compensación, una sola instancia, sin garantía multi-documento ante caída del proceso/red. Replica set probado de forma independiente.
- Tras fallo de compensación se requiere revisión manual antes de reiniciar; bloqueo en memoria.
- Smoke/seed y tests deben ejecutarse con MongoDB disponible. Smoke requiere además la API activa.
- Windows/Linux: instrucciones portables, sin ejecución en esos sistemas.

## Cierre de entrega

Instalación reproducible comprobada con `npm ci` en ambos proyectos: exit 0; después se repitieron 75 tests backend, 21 tests frontend, build y audits con los resultados de la tabla. Smoke real volvió a pasar 6/6. El replica set temporal de QA se detuvo al terminar; el servicio MongoDB original permanece activo. Push de `main` completado a https://github.com/luivmz/cuenta-bancaria-fullstack sin force push. La API pública de GitHub confirmó `private=false` y `default_branch=main`; HEAD local, origin/main y ls-remote coincidieron. Se comprobó árbol limpio y exclusión de .env, node_modules y dist. GitHub CLI no estaba instalado; se publicó con Git y las credenciales existentes. No quedan pendientes funcionales; las limitaciones de alcance se detallan arriba.
