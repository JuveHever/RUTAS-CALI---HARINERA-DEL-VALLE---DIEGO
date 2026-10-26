# Rutas Propuesta Cali · Harinera del Valle

Tablero de las cuatro rutas propuestas para noviembre de 2026 en Cali y Jamundí:
**HV 10** (panel con espacios para ARA/Dollarcity) y las rutas exclusivas **7, 47 y 45** (escenario moderado).

Muestra cumplimiento de frecuencias, horarios de visita, agenda del mes, tiempo libre para ARA o Dollarcity
y un análisis geoespacial (territorio de cada ruta y cercanía entre rutas).

Hecho con React + Vite. Los datos van dentro del proyecto (`src/data/rutas.json`); no necesita base de datos ni claves.

## Publicarlo en Vercel (una sola vez)

1. **Subir a GitHub**
   - Entra a github.com → **New repository** → nombre sugerido `rutas-propuesta-cali` → **Create repository**.
   - En la página del repositorio vacío, elige **uploading an existing file** y arrastra **todo el contenido** de esta carpeta
     (no la carpeta en sí; tampoco `node_modules` ni `dist` si existen). **Commit changes**.
   - Si usas Git en el computador:
     ```bash
     git init
     git add .
     git commit -m "Tablero rutas propuesta Cali"
     git branch -M main
     git remote add origin https://github.com/<tu-usuario>/rutas-propuesta-cali.git
     git push -u origin main
     ```
2. **Desplegar en Vercel**
   - Entra a vercel.com → **Add New… → Project** → **Import** el repositorio.
   - Vercel detecta **Vite** solo. Deja los valores: Build Command `npm run build`, Output Directory `dist`.
   - **Deploy**. En un minuto queda el enlace (`https://rutas-propuesta-cali.vercel.app` o similar).
3. Cada vez que subas un cambio a GitHub, Vercel publica la nueva versión automáticamente.

## Verlo en el computador (opcional)

Necesitas Node.js 18 o superior.

```bash
npm install
npm run dev
```

Abre la dirección que aparece (normalmente http://localhost:5173).

## Qué trae el tablero

- **Portada** «Rutas propuesta Cali» con el mapa de los 22 puntos de venta en su coordenada real.
- **Filtros** por ruta y por punto de venta (todo el tablero responde).
- **Resumen**: cumplimiento de frecuencia, visitas, horas en tienda, tiempo libre para ARA/Dollarcity y ocupación de la jornada.
- **Mapa** (Esri: mapa claro, calles o satélite) con dos vistas:
  - **Rutas propuestas**: territorio de cada ruta, tamaño del punto según horas de visita, cercanía entre rutas y el recorrido numerado del día elegido.
  - **Cobertura HDV**: los puntos del panel en verde (cubiertos por Harinera del Valle, programados en octubre 2026) o rojo (sin cobertura),
    y las tiendas ARA y Dollarcity en naranja. Cada color se puede ocultar; resumen por municipio y cadena al lado.
  - **Mixta**: las rutas con sus figuras y, en el mismo mapa, los puntos verdes, rojos y naranjas a menos de 500 m, 1 km o 2 km
    de algún punto de ruta (círculo punteado). Al lado, cuántos quedan cerca de cada ruta y la lista ordenada por distancia;
    clic en un nombre para ir a ese punto. Responde a los filtros de ruta y punto de venta.
- **Detalle del día**: en los días con tiempo libre, las 3 tiendas ARA o Dollarcity más cercanas al último punto.
- **Calendario de tiempo libre**: minutos libres por ruta y día; clic para ver ese día.
- **Agenda del mes**: visitas, almuerzo, desplazamientos y espacio libre de cada día, de 8:00 al fin de la jornada.
- **Cumplimiento por punto de venta**, **tabla de tiempos y horarios** y **hallazgos geoespaciales**.

## Actualizar los datos

Reemplaza `src/data/rutas.json` por una versión nueva con la misma estructura y vuelve a subirlo a GitHub.
Estructura resumida:

```
meta     → mes, jornada, supuestos
days     → días hábiles (fecha, semana, capacidad en minutos, fin de jornada)
routes[] → id, name, color, shape, territory, pdvs[], days[]
  pdvs[] → code, name, lat, lon, min (duración), obj, prog, extra, fechas, sug
  days[] → fecha, serv, travel, km, free, gmaps, stops[], segs[]
  segs[] → tipo (visita | continua | almuerzo | libre), start, end (minutos desde medianoche), code, orden, modo, km, tmin
vecinos  → pares de puntos de rutas distintas a menos de 1,6 km
```

La vista de cobertura lee `src/data/cobertura.json`:

```
resumen  → panel, cub, nocub, ara, dollar, corte
panel[]  → c (código), n (nombre), cad (cadena), ciu (municipio), cub (1 cubierto / 0 sin cobertura), ruta (rutero), rp (ruta propuesta o null), la, lo
ara[]    → n (nombre), cad (Ara | Dollarcity), dir, mun, la, lo
```

## Supuestos

- Jornada lun–jue 8:00–15:40 y vie–sáb 8:00–16:40, con 1 h de almuerzo. Sin domingos ni festivos (2 y 16 de noviembre).
- Desplazamiento estimado en línea recta × 1,3; a pie hasta 1 km; carro a 20 km/h en ciudad y 45 km/h entre Cali y Jamundí, + 8 min por trayecto.
- El día empieza en el primer punto de venta. Espacio libre = 30 min o más sin mover visitas del panel.
