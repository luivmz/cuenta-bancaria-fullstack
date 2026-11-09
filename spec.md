# Especificación: cuenta bancaria simplificada

## Objetivo, alcance y actores
Aplicación académica local para que un operador consulte tres cuentas de demostración, deposite, retire, transfiera y revise movimientos. Sin autenticación, pagos reales ni administración de cuentas. React/Vite/JSX y Tailwind en client; Express/JavaScript y Mongoose/MongoDB local en server.

## Requisitos funcionales
RF01 consultar cuenta y saldo; RF02 depositar; RF03 retirar hasta el saldo disponible; RF04 transferir a otra cuenta existente; RF05 historial descendente; RF06 actualizar saldo e historial después de cada operación sin recarga; RF07 seed reproducible; RF08 feedback, bloqueo de doble envío y selección de cuenta.

## Requisitos no funcionales
Separación Route → Controller → Service → Model; dinero entero; errores JSON sin stack; CORS limitado al origen local; formularios accesibles; responsive desde 360 px; pruebas aisladas; configuración por entorno; lockfiles; ninguna dependencia de servicios externos para operar. No es banca de producción.

## Reglas y dinero
La base almacena balance y amount en **centavos enteros seguros**. La API recibe monto como número JSON en soles con hasta dos decimales y devuelve balance/amount en soles, además de balanceCents/amountCents para exactitud. Se rechazan strings, booleanos, null, NaN, infinito, cero, negativos, más de dos decimales y cantidades que excedan el entero seguro. Ningún saldo excede Number.MAX_SAFE_INTEGER ni baja de cero. accountNumber es único, inmutable y se usa como :id público estable (ej. 001-000001), nunca ObjectId como contrato público.

## Modelo
Account: accountNumber (único, requerido, formato 001-000001), holderName (trim, requerido), balance (centavos enteros >=0), timestamps.
Transaction: type enum DEPOSIT/WITHDRAWAL/TRANSFER, amount (centavos >0), sourceAccount/destinationAccount (referencias Account, null según tipo), timestamps. Un movimiento por transferencia, visible para ambas cuentas. Índices por participantes y fecha.

## Contratos API
Todas las respuestas exitosas: {data: ...}; errores: {error: {code, message}}.
- GET /api/health: 200 si DB disponible; 503 si no. Incluye modo de consistencia.
- GET /api/cuenta/:id: 200 {id, accountNumber, holderName, balance, balanceCents, currency: PEN}; 404 inexistente.
- POST /api/cuenta/deposito: {cuentaId, monto}; 200 {account, transaction}.
- POST /api/cuenta/retiro: {cuentaId, monto}; 200 {account, transaction}.
- POST /api/cuenta/transferencia: {cuentaOrigenId, cuentaDestinoId, monto}; 200 {sourceAccount, destinationAccount, transaction}.
- GET /api/cuenta/:id/historial: 200 array con id, type, amount, amountCents, createdAt, sourceAccount/destinationAccount ({accountNumber, holderName} o null), últimas 100, createdAt e _id descendentes; 404 cuenta inexistente.
Datos inválidos/saldo insuficiente: 400; cuenta inexistente: 404; fallo inesperado: 500. JSON malformado: 400; cuerpo excesivo: 413. No se aceptan propiedades extra ni identificadores objeto/operadores MongoDB.

## Transferencia y concurrencia
Se detecta hello.setName o mongos. En replica set se utiliza session.withTransaction para saldo origen, destino y registro; $inc condicionado al saldo y límite seguro. En standalone se serializan las mutaciones y lecturas de cuenta/historial en **un proceso** y se compensan actualizaciones confirmadas si falla un paso posterior. Si falla compensación se bloquean mutaciones hasta reinicio y se emite error explícito en logs, para revisión manual. No se reintentan escrituras con resultado incierto. No hay atomicidad entre documentos ante caída de proceso/red en standalone: usar replica set para garantizarla. El modo standalone solo admite una instancia y ningún escritor externo. Débito siempre condicionado a balance >= monto, incluso en concurrencia.

## Validaciones y casos extremos
Cuenta desconocida; falta de cuenta/monto; monto decimal >2; tipo incorrecto; cantidad máxima; saldo exacto; destino propio/inexistente; débitos simultáneos; desbordamiento de destino; fallo de inserción de historial; rollback; historial vacío; cambio de cuenta mientras carga; doble submit; error de red; MongoDB no disponible. Seed destruye exclusivamente accounts/transactions de la DB dedicada cuenta_bancaria y requiere nombre permitido. Tests usan DB temporal propia con prefijo cuenta_bancaria_test_. Smoke crea cuentas aisladas temporales y las elimina al finalizar.

## Criterios de aceptación
Los cinco endpoints funcionan con persistencia local, errores correctos y centavos exactos; transferencias conservan suma y aparecen en ambos historiales; pruebas rechazan escenarios inválidos; retiros concurrentes no sobregiran; la UI refleja operaciones sin refresh, usa props/useState/useEffect y Tailwind real; responsive y accesible por teclado; seed >=3 cuentas; npm test, smoke, build y audit documentados con evidencia real.

## Definición de terminado
Implementación en /server y /client, seed, pruebas de API y React, smoke real, build, audit, QA visual cuando sea posible, README portable, documentación QA, historial Git semántico, repositorio público y push verificados cuando permisos/autenticación lo permitan. Los bloqueos deben documentarse sin declarar verificaciones ficticias.
