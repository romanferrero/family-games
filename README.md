# 🏆 Olimpiadas Familiares

Aplicación web para organizar y gestionar jornadas de juegos en familia. Permite crear equipos, administrar juegos, llevar puntajes en tiempo real y publicar desafíos, todo sincronizado en la nube con Supabase.

> Proyecto personal desarrollado con **React 19**, **Tailwind CSS 4** y **Supabase**.

---

## ✨ Funcionalidades

- **Dos roles de acceso** — Administrador (gestión completa) y Jugador (vista de solo lectura).
- **Dashboard** — Resumen de la jornada con estadísticas, líder actual y progreso general.
- **Gestión de equipos** — Crear, editar y eliminar equipos con integrantes, colores y emojis personalizados.
- **Gestión de juegos** — CRUD completo con categorías (mental, físico, creativo, aventura) y estados (pendiente/realizado).
- **Puntajes en vivo** — Sumar y restar puntos por equipo con actualización instantánea.
- **Ranking** — Tabla de posiciones con podio visual y barras de progreso.
- **Desafíos** — Sistema de publicación de retos con estados borrador/publicado.
- **Sincronización cloud** — Persistencia y sincronización en tiempo real vía Supabase (polling cada 8s).
- **Responsive** — Sidebar colapsable con soporte completo para mobile y desktop.

---

## 🛠️ Tecnologías

- **React 19** — Componentes funcionales con Hooks (useState, useEffect, useCallback, useMemo, useRef).
- **Tailwind CSS 4** — Estilos utility-first vía plugin de Vite.
- **Vite 8** — Bundler y dev server.
- **Supabase** — Backend as a Service (base de datos PostgreSQL + API REST).
- **ESLint** — Linting con plugins para React Hooks y React Refresh.

---

## 🚀 Cómo usarlo

1. Cloná el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/family-games.git
   cd family-games
   ```
2. Instalá las dependencias:
   ```bash
   npm install
   ```
3. Configurá las variables de entorno creando un archivo `.env`:
   ```
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_anon_key
   ```
4. Levantá el servidor de desarrollo:
   ```bash
   npm run dev
   ```

> La app funciona sin Supabase usando datos mock en memoria. Con Supabase configurado, los datos persisten y se sincronizan entre dispositivos.

---

## 🔐 Acceso

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Admin | `admin` | `admin2026` |
| Jugador | — | Sin credenciales, acceso libre |

---

## 👤 Autor

**Roman Ferrero**

📚 Estudiante de Ingeniería en Sistemas | Full-Stack Developer en Coderhouse