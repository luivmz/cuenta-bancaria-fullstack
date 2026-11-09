# Plan de implementación

Estados: pendiente, implementado (sin verificar), verificado, bloqueado. Solo evidencia ejecutada permite marcar verificado.

- [ ] Fase 1. Setup. Evidencia: pendiente.
- [ ] Fase 2. Especificación. Evidencia: pendiente.
- [ ] Fase 3. MongoDB. Evidencia: pendiente.
- [ ] Fase 4. Modelos. Evidencia: pendiente.
- [ ] Fase 5. Seed. Evidencia: pendiente.
- [ ] Fase 6. Backend base. Evidencia: pendiente.
- [ ] Fase 7. Consulta de cuenta. Evidencia: pendiente.
- [ ] Fase 8. Depósitos. Evidencia: pendiente.
- [ ] Fase 9. Retiros. Evidencia: pendiente.
- [ ] Fase 10. Transferencias. Evidencia: pendiente.
- [ ] Fase 11. Historial. Evidencia: pendiente.
- [ ] Fase 12. Testing backend. Evidencia: pendiente.
- [ ] Fase 13. React + Vite. Evidencia: pendiente.
- [ ] Fase 14. Tailwind. Evidencia: pendiente.
- [ ] Fase 15. Componentes. Evidencia: pendiente.
- [ ] Fase 16. Integración API. Evidencia: pendiente.
- [ ] Fase 17. Estado React. Evidencia: pendiente.
- [ ] Fase 18. QA. Evidencia: pendiente.
- [ ] Fase 19. README. Evidencia: pendiente.
- [ ] Fase 20. Git/GitHub. Evidencia: pendiente.
- [ ] Fase 21. Verificación final. Evidencia: pendiente.

## Auditoría inicial
Directorio vacío. Node 20.20.2, npm 10.8.2, Git 2.54.0, MongoDB 8.0.34, mongosh 2.14.0, macOS ARM64. Homebrew registra mongodb-community@8.0 iniciado. Configuración local sin replication; conexión bloqueada por sandbox (EPERM). gh ausente. git init rechazado al escribir .git. No se modificó MongoDB del sistema.

## Reanudación (2026-11-09)
Se conservaron los 17 archivos del backend y las carpetas vacías del frontend. La restricción de permisos anterior ya no aplica: hello responde en TCP 27017, sin setName (standalone), proceso Homebrew existente. Red npm disponible. Git inicializado en main; antes no existía repositorio. Próximo paso exacto: instalar dependencias, escribir y ejecutar pruebas y verificar seed/API antes del frontend.
