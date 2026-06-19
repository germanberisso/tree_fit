# TreeFit - Sistema de Gestión de Entrenamiento Integral

TreeFit es una plataforma web cliente-servidor responsiva diseñada para digitalizar, centralizar y optimizar la interacción técnica y el seguimiento operativo entre profesores de educación física (personal trainers) y alumnos en entornos de musculación.

El sistema elimina las planificaciones analógicas en papel, mitiga la pérdida de datos históricos y provee herramientas avanzadas de analítica biométrica y control de inventario en tiempo real (Validación de Recursos - RF8).

## 1. Arquitectura y Tecnologías

El sistema utiliza una arquitectura completamente desacoplada mediante una API RESTful y una aplicación de página única (SPA).

### Backend
- **Framework:** FastAPI (Python 3.8+) - Utilizado por su alto rendimiento asíncrono y validación nativa.
- **ORM:** SQLAlchemy - Abstracción de la base de datos mediante mapeo objeto-relacional declarativo.
- **Validación de Datos:** Pydantic V2 - Validación estricta de esquemas de datos en tipado entrante y saliente.
- **Seguridad:** JWT (JSON Web Tokens) mediante `python-jose` y hashing asimétrico de contraseñas con `bcrypt`.
- **Drivers de BD:** `psycopg2-binary` (para producción) y soporte nativo `sqlite3` (para desarrollo/testing).

### Frontend
- **Librería Principal:** React 19 - Construcción de interfaz de usuario basada en componentes modulares.
- **Herramienta de Construcción:** Vite - Entorno de desarrollo rápido y empaquetado optimizado.
- **Enrutamiento:** React Router Dom V7 - Gestión de rutas del lado del cliente y protección de vistas por rol.
- **Estilos y UI:** CSS3 puro con variables raíz y tokens de diseño avanzados (efecto glassmorphism).
- **Visualización:** Gráficos analíticos dinámicos basados en elementos SVG nativos.
- **Notificaciones:** React Hot Toast - Intercepción de respuestas de red y alertas en tiempo real.

---

## 2. Estructura del Repositorio

```text
tree_fit/
├── package-lock.json
├── .gitignore
├── backend/
│   ├── app/
│   │   ├── rutas/
│   │   │   ├── alumnos.py
│   │   │   ├── autenticacion.py
│   │   │   ├── biometria.py
│   │   │   ├── ejercicios.py
│   │   │   ├── entrenamientos.py
│   │   │   ├── rutinas.py
│   │   │   ├── estadisticas.py
│   │   │   └── validaciones.py (Lógica del RF8)
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── esquemas.py
│   │   ├── main.py
│   │   ├── modelos.py
│   │   ├── seguridad.py
│   │   └── semilla.py
│   ├── .env.example
│   ├── requirements.txt
│   ├── reset-db.py
│   └── test_main.py
└── frontend/
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    ├── src/
    │   ├── assets/
    │   │   ├── hero.png
    │   │   ├── react.svg
    │   │   └── vite.svg
    │   ├── components/
    │   │   ├── GraficosBiometria.jsx
    │   │   └── Navegacion.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── alumno/
    │   │   │   ├── EntrenamientoActivo.jsx
    │   │   │   ├── HistorialEntrenamientos.jsx
    │   │   │   └── ProgresoBiometrico.jsx
    │   │   ├── profesor/
    │   │   │   ├── CatalogoEjercicios.jsx
    │   │   │   ├── DetalleAlumno.jsx
    │   │   │   ├── EstadisticasProfesor.jsx
    │   │   │   └── ListaAlumnos.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
```

---

## 3. Configuración e Instalación Local

### Requisitos Previos

- **Python:** Versión 3.8 o superior.
- **Node.js:** Versión v18 o superior (incluyendo el gestor de paquetes `npm`).
- **Base de Datos:** Motor **PostgreSQL** instalado localmente (v14 o superior) junto con herramientas de administración como pgAdmin 4.

---

### Configuración del Backend (FastAPI)

1. Abra una terminal de comandos e ingrese al directorio del servidor:

```bash
   cd backend
```

2. Inicialice el entorno virtual de Python para aislar el árbol de paquetes del proyecto:

```bash
   python -m venv venv
```

3. Active el entorno virtual según el gestor de consola o sistema operativo que esté utilizando:

```bash
   # En Windows (Git Bash) o Linux/macOS:
   source venv/Scripts/activate

   # En Windows (PowerShell):
   .\venv\Scripts\activate

   # En Windows (CMD - Símbolo del Sistema):
   venv\Scripts\activate
```

   > **Nota:** Sabrá que se encuentra activo porque visualizará la leyenda `(venv)` al principio de la línea de comandos.

4. Actualice las herramientas base e instale el manifiesto completo de dependencias de la aplicación:

```bash
   python -m pip install --upgrade pip
   pip install wheel
   pip install -r requirements.txt
```

   > **Nota técnica para Windows:** Si la instalación automatizada del conector `psycopg2-binary` presentara advertencias o requiriera compiladores nativos de C++ externos, puede forzar la descarga de la versión ejecutable binaria precompilada estable mediante:
   >
   > ```bash
   > pip install psycopg2-binary==2.9.3
   > ```

5. **Habilitación de Persistencia Local Automática:** Antes de inicializar el servidor, abra el archivo `backend/app/main.py` y descomente las líneas encargadas de la verificación de PostgreSQL. El bloque debe quedar activo de la siguiente manera:

```python
   from app.crear_db import asegurar_base_datos

   # Ejecutar verificación y creación de base de datos en caso de usar PostgreSQL
   asegurar_base_datos()
```

6. Configure las variables de entorno locales generando un archivo llamado estrictamente `.env` en la raíz de la carpeta `backend/`:

```env
   # Cadena de conexión hacia su motor de PostgreSQL local
   # Reemplace 'TU_CONTRASENA_REAL' por la clave que utiliza en su pgAdmin
   DATABASE_URL=postgresql://postgres:TU_CONTRASENA_REAL@localhost:5432/tree_fit

   JWT_SECRET=supersecretjwtkeyforgymmanagementapptreefit2026!
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

7. Inicie el servidor asincrónico local de desarrollo a través de Uvicorn especificando el puerto `8050`:

```bash
   uvicorn app.main:app --reload --port 8050
```

> **Inicialización Automatizada:** Al procesar el arranque por primera vez, el servidor invocará al módulo `asegurar_base_datos()`, creando de forma transparente la base `tree_fit` en su PostgreSQL. El ORM de SQLAlchemy instanciará las 10 tablas relacionales del sistema e invocará a `semilla.py` para sembrar el catálogo inicial de ejercicios y equipamientos de manera atómica.

La documentación interactiva de la API (Swagger) quedará disponible en:
`http://localhost:8050/docs`

---

### Configuración del Frontend (React + Vite)

1. Abra una nueva terminal y navegue hacia el directorio del cliente:

```bash
   cd frontend
```

2. Realice la descarga e instalación limpia de todos los paquetes y módulos de Node:

```bash
   npm install
```

3. Establezca las variables de entorno del cliente generando un archivo `.env` en la raíz de la carpeta `frontend/`:

```env
   VITE_API_URL=http://localhost:8050/api
```

4. Inicie la aplicación web en modo de desarrollo con Hot Module Replacement (HMR):

```bash
   npm run dev
```

El portal interactivo de TreeFit estará disponible en:
`http://localhost:5180`

---

## 4. Suite de Pruebas Automatizadas (Testing)

El backend incorpora una suite de pruebas automatizadas unitarias y de integración que se ejecutan sobre una base de datos SQLite aislada en memoria.

Para instalar las dependencias de testing y ejecutar las pruebas:

```bash
cd backend
pip install pytest httpx
pytest test_main.py -v
```

### Alcance de los Tests

- **Pruebas Unitarias:** Verificación del hashing y contrastación criptográfica de contraseñas; cálculo del estado de habilitación de ejercicios según disponibilidad técnica de equipamiento (RF8).
- **Pruebas de Integración:** Registro completo de usuarios, inicio de sesión (Login) con retorno de tokens JWT y validación del middleware de denegación de acceso a rutas protegidas sin credenciales válidas.

---

## 5. Infraestructura y Despliegue en Producción

El sistema se encuentra desplegado en producción bajo la siguiente arquitectura de infraestructura en la nube:

- **Frontend (Cliente):** Alojado en Render como aplicación estática.  
  URL Oficial: `https://tree-fit.onrender.com/`

- **Backend (Servidor de Aplicaciones):** Desplegado en Render como Web Service conectado al repositorio de control de versiones.  
  URL Base de la API: `https://tree-fit-backend.onrender.com/`

- **Base de Datos (Persistencia):** Motor relacional PostgreSQL hospedado de forma remota en la infraestructura de Supabase, garantizando alta disponibilidad, transaccionalidad ACID y copias de seguridad automáticas.

---

## 6. Lógica de Control y Validaciones Críticas

### Validación de Recursos (RF8)

El sistema controla que no se puedan asignar ni registrar ejercicios cuyas máquinas o materiales asociados estén fuera de servicio o no disponibles.

- **Al crear rutinas:** El backend (`validar_recursos_rutina`) rechaza la petición con código `400 Bad Request` si el profesor intenta asignar un ejercicio cuyo equipamiento está marcado como `disponible = False`.

- **Al consultar e iniciar rutinas:** Las consultas a las rutinas evalúan dinámicamente el catálogo. Si un material cambia de estado a "No disponible" con posterioridad al armado de la rutina, el frontend deshabilita visualmente el ejercicio mostrando la alerta pertinente y bloqueando la carga de series de entrenamiento por parte del alumno.

### Control de Roles y Permisos (RF14)

La API valida los tokens JWT en cada petición interceptando el rol del portador.

- Endpoints de creación de alumnos, modificación de fichas médicas, alteración del catálogo de ejercicios y diseño de rutinas: **restringidos al rol profesor**.
- Los alumnos poseen:
  - **Permisos de lectura** sobre sus planes.
  - **Permisos de escritura** en la carga de entrenamientos en tiempo real y métricas corporales personales.