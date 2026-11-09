# Plan de implementación

Estados: pendiente, implementado (sin verificar), verificado, bloqueado. Solo evidencia ejecutada permite marcar verificado.

- [x] Fase 1. Setup. Verificado: Node/npm/Git auditados; package.json separados y lockfiles; configuración local ignorada.
- [x] Fase 2. Especificación. Verificado: spec.md revisado contra contratos y criterios del prompt.
- [x] Fase 3. MongoDB. Verificado: hello en 27017 confirmó standalone; replica set temporal rs0 probado en 27018 sin alterar servicio.
- [x] Fase 4. Modelos. Verificado: Pruebas reales de esquemas, índice único y centavos dentro de suite backend (75/75).
- [x] Fase 5. Seed. Verificado: npm run seed: exit 0, tres cuentas y depósitos de apertura.
- [x] Fase 6. Backend base. Verificado: Health 200 con MongoDB y errores JSON verificados por Supertest y smoke.
- [x] Fase 7. Consulta de cuenta. Verificado: Cuenta existente 200 e inexistente 404 probadas.
- [x] Fase 8. Depósitos. Verificado: Depósito exacto y entradas inválidas probados; recorrido Safari S/15.90.
- [x] Fase 9. Retiros. Verificado: Saldo exacto, insuficiente y concurrencia probados; recorrido Safari S/5.90.
- [x] Fase 10. Transferencias. Verificado: Transferencias y rollback probados en standalone y replica set; recorrido real a Ana.
- [x] Fase 11. Historial. Verificado: Tres tipos, orden y ambas perspectivas probados; recorrido real.
- [x] Fase 12. Testing backend. Verificado: npm test: 75/75; replica set integración: 50 pass, 2 skips exclusivos de standalone.
- [x] Fase 13. React + Vite. Verificado: Scaffold create-vite React; Vite 8.3.6 ejecutado y build exit 0.
- [x] Fase 14. Tailwind. Verificado: Tailwind 4.3.5 plugin Vite según documentación oficial; CSS generado y QA visual.
- [x] Fase 15. Componentes. Verificado: Componentes modulares con props; 21 pruebas frontend.
- [x] Fase 16. Integración API. Verificado: Servicios API centralizados; smoke 6/6 y operaciones reales en Safari.
- [x] Fase 17. Estado React. Verificado: useState/useEffect; refresh sin reload; doble envío y cambio de cuenta cubiertos por tests.
- [x] Fase 18. QA. Verificado: docs/QA.md; QA visual 360/820/desktop, teclado y errores; audits 0/0; capturas reales.
- [x] Fase 19. README. Verificado: README español con instalación, seed, API, arquitectura, replica set y portabilidad.
- [ ] Fase 20. Git/GitHub. Evidencia: pendiente.
- [ ] Fase 21. Verificación final. Evidencia: pendiente.

## Auditoría inicial
Directorio vacío. Node 20.20.2, npm 10.8.2, Git 2.54.0, MongoDB 8.0.34, mongosh 2.14.0, macOS ARM64. Homebrew registra mongodb-community@8.0 iniciado. Configuración local sin replication; conexión bloqueada por sandbox (EPERM). gh ausente. git init rechazado al escribir .git. No se modificó MongoDB del sistema.

## Reanudación (2026-11-09)
Se conservaron los 17 archivos del backend y las carpetas vacías del frontend. La restricción de permisos anterior ya no aplica: hello responde en TCP 27017, sin setName (standalone), proceso Homebrew existente. Red npm disponible. Git inicializado en main; antes no existía repositorio. Próximo paso exacto: instalar dependencias, escribir y ejecutar pruebas y verificar seed/API antes del frontend.

## Verificación de portabilidad
`npm ci` ejecutado con éxito en server y client. Tras reinstalar desde lockfiles: 75 tests backend, 21 tests frontend, build Vite de 25 módulos y auditorías 0/0; smoke real 6/6. El script de tests backend no depende de expansión de globs del shell. `.nvmrc` fija la versión de Node verificada. Capturas reales incorporadas a docs/capturas. Replica set temporal de QA detenido; servicio MongoDB original sin cambios.
