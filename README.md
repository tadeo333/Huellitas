# 🐾 Huellitas · Expediente digital para tus perros

Aplicación web completa para llevar el expediente médico, la cartilla de vacunación, las citas, el peso y los recordatorios de uno o varios perros.

## Qué incluye
- Cuentas con correo y contraseña; los datos de cada usuario son privados.
- Varios perros por cuenta, con perfil completo y foto.
- Cartilla de vacunación con estado (aplicada / próxima a vencer / pendiente) y foto del comprobante.
- Citas: calendario mensual, semanal, próximas e historial; agendar, editar y cancelar.
- Historial médico, control de peso con gráfica y recordatorios (7, 3, 1 días antes y el mismo día).
- Sincronización entre dispositivos (mismo servidor y misma cuenta), validación de datos, modo claro y oscuro.

## Requisitos
- [Node.js 18 o superior](https://nodejs.org) (incluye `npm`).
- Visual Studio Code (opcional, recomendado).

## Instalar y ejecutar
```bash
npm install
npm start
```
Abre **http://localhost:3000**, crea tu cuenta y empieza.

En VS Code: *Archivo → Abrir carpeta…* → elige esta carpeta → abre la terminal → `npm install` → pulsa **F5** (usa `.vscode/launch.json`). Para que el servidor se reinicie al editar: `npm run dev`.

## Estructura
```
server.js          API (Express) + base de datos SQLite + autenticación
public/index.html  Página
public/styles.css  Estilos (colores en variables CSS al inicio)
public/api.js      Conexión con el servidor y sincronización
public/app.js      Pantallas y lógica (vacunas, citas, peso, etc.)
data/              Se crea sola: base de datos (huellitas.db) y clave de sesión
```
Cada dato se guarda como un documento JSON en la tabla `docs`. Para añadir un campo nuevo, edita el esquema `F` en `public/app.js`.

## Usarla desde el celular
Con el servidor encendido, abre en el celular `http://IP-DE-TU-PC:3000` (misma red Wi-Fi). Para usarla fuera de casa, publícala (abajo).

## Publicarla en internet
1. Sube la carpeta a GitHub (`node_modules/` y `data/` ya están en `.gitignore`).
2. Crea un servicio Node en Render, Railway o Fly.io con comando de inicio `npm start`.
3. Variables: `JWT_SECRET` (texto largo aleatorio) y `DATA_DIR` apuntando a un **disco persistente** (por ejemplo `/var/data`); sin disco persistente se pierden los datos al reiniciar.
4. Usa HTTPS (lo ofrecen esas plataformas).

## Respaldo
Copia la carpeta `data/` (o `DATA_DIR`) con el servidor apagado.

## Límites conocidos
- Las notificaciones del navegador solo se muestran con la página abierta; no hay avisos push con la app cerrada.
- Las fotos se comprimen y se guardan dentro de la base de datos; los PDF no se pueden adjuntar.
- No hay recuperación de contraseña por correo.
- Los recordatorios de vacunas usan solo las fechas que tú registras.
