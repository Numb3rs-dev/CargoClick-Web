Dijiste:

06-08-2021_Resolucion_20213040034405_Actualizacion_SICETAC.pdf
PDF
Necesito que me hagas un muy buen analissi del docuemto adjunto, sacame toda la informacion resumida a detalle, estoy trabajando en un cotizador y voy an ecesitar el detalle exacto ademas me intereza la informacion que dice ahi de temas legales

ChatGPT dijo:

Pensado durante 12s
Listo, Jen. Leí el PDF completo (Resolución 20213040034405 del 06-08-2021 + Anexo técnico) y te dejo un resumen “para construir cotizador” con detalle operativo + lo legal. 
06-08-2021_Resolucion_202130400…


1) Qué es esta Resolución y qué cambia
Acto administrativo del Ministerio de Transporte (Ministra de Transporte) que actualiza el Protocolo del SICE-TAC (Sistema de Información de Costos Eficientes para el Transporte Automotor de Carga por Carretera) para publicar/actualizar:

Los costos eficientes del transporte de carga por carretera.

El Índice de Costos del Transporte de Carga por Carretera (ICTC).

La metodología y parámetros que usa el sistema para calcular esos costos. 
06-08-2021_Resolucion_202130400…


En simple: no es un tarifario “libre”, es un marco técnico oficial (con fuentes oficiales) para estimar costos.

2) Lo “legal” que te importa (lo más relevante para riesgo y compliance)
2.1. Base normativa (sustento)
En considerandos se apoya en normas del sector transporte que le dan competencia al MinTransporte para regular/definir lineamientos del servicio público de transporte y herramientas de información como SICE-TAC (se citan, entre otras, Ley 105 de 1993, Ley 336 de 1996, y normas compiladas en el Decreto 1079 de 2015). 
06-08-2021_Resolucion_202130400…


2.2. Objeto y alcance (Artículo 1 y 2)
Art. 1 (Objeto): “Actualizar el protocolo” del SICE-TAC (es decir, reglas/metodología y el modelo de costos). 
06-08-2021_Resolucion_202130400…


Art. 2 (Ámbito / publicación): indica que la metodología/protocolo actualizado se publica en el SICE-TAC (y aplica para los actores del transporte de carga por carretera en Colombia, como marco de referencia de costos). 
06-08-2021_Resolucion_202130400…


2.3. Periodicidad “oficial” de actualización (clave para tu cotizador)
En el Anexo (Periodicidad de actualización) se establece:

Costos variables: actualización mensual con publicación típica dentro de los primeros días hábiles (se menciona ventana de ~5 días hábiles) y con fuentes oficiales (MinMinas/ACPM, peajes, etc.). 
06-08-2021_Resolucion_202130400…


Costos fijos: actualización anual (se menciona generalmente en enero). 
06-08-2021_Resolucion_202130400…


Implicación práctica: tu cotizador debería tener versionado por mes (variables) y por año (fijos), y guardar el “snapshot” usado para cada cotización (trazabilidad).

2.4. Riesgo legal típico si lo implementas mal
Si tu plataforma vende “tarifas” como obligatorias, podrías meterte en discusiones con clientes/transportistas. Este documento está enfocado en costos eficientes y su cálculo, no en prometer un precio único para todo.

Si no guardas evidencia de fuentes/fecha de actualización, te expones a reclamos por “cálculo desactualizado”.

3) Lo resolutivo (los artículos, resumidos)
Además de Objeto/Ámbito (arriba), la Resolución trae artículos que ordenan:

Actualización de rendimientos y de la canasta de costos variables (se ajustan parámetros que alimentan el cálculo). 
06-08-2021_Resolucion_202130400…


Incorporación de resultados del ICTC al SICE-TAC (y su publicación). 
06-08-2021_Resolucion_202130400…


Periodicidad de actualización (mensual variables / anual fijos). 
06-08-2021_Resolucion_202130400…


Parámetros y metodología para la actualización del SICE-TAC: se formaliza que el cálculo sigue lo definido en el protocolo y sus fuentes. 
06-08-2021_Resolucion_202130400…


Vigencia: rige desde su publicación (y deroga/modifica lo que le sea contrario en lo pertinente). 
06-08-2021_Resolucion_202130400…


4) Anexo técnico (esto es lo que necesitas para tu cotizador)
4.1. Definiciones operativas (para campos y lógica)
En el anexo aparecen definiciones clave como:

Flete: precio pactado por transportar la carga en una ruta origen–destino. 
06-08-2021_Resolucion_202130400…


Nudo vial: nodo/centro administrativo usado como referencia para origen/destino en el sistema (útil para estandarizar rutas). 
06-08-2021_Resolucion_202130400…


SICE-TAC: sistema que estima costos eficientes según características del vehículo, ruta y operación. 
06-08-2021_Resolucion_202130400…


Terreno plano / ondulado / montañoso: clasificaciones de ruta que impactan rendimiento/consumo. 
06-08-2021_Resolucion_202130400…


Implicación para UX del cotizador: el usuario no debería elegir “plano/ondulado/montañoso” a mano; ideal que tu backend lo infiera por la ruta, pero si no puedes aún, déjalo como selector avanzado.

5) Estructura del modelo de costos (lo que tu cotizador debe calcular)
El protocolo separa el costo total en 3 bloques:

A) Costos fijos (CF)
Se calculan mensualmente con base en componentes que se actualizan anual (o por reglas). La fórmula general aparece así:

CF = Capital + Seguros + Salarios + Parqueadero + Impuestos + Comunicaciones + (otros fijos)
(En el documento aparece CF con esos términos agrupados). 
06-08-2021_Resolucion_202130400…


Componentes de CF (detalle):

Recuperación de capital (Capital)

Depende de: valor del vehículo, tiempo de recuperación, tasa de interés (mensual), etc.

El anexo incluye tabla de tiempos (meses) por configuración/tipo de vehículo. 
06-08-2021_Resolucion_202130400…


Salarios

Referencia normativa: salario mínimo y factores prestacionales (se calcula el costo mensual del conductor con multiplicadores: base + prestaciones). 
06-08-2021_Resolucion_202130400…


Seguros

Incluye SOAT y seguros “todo riesgo” / otros, con referencia a fuentes de mercado/aseguradoras. 
06-08-2021_Resolucion_202130400…


Impuestos

Impuesto vehicular prorrateado mensual. 
06-08-2021_Resolucion_202130400…


Parqueadero

Se mensualiza a partir de tarifa diaria/nocturna (el anexo muestra el prorrateo por 30 días). 
06-08-2021_Resolucion_202130400…


Comunicaciones

GPS/telecom / costos asociados para georreferenciación (se trae de una fuente oficial sectorial). 
06-08-2021_Resolucion_202130400…


Revisión técnico-mecánica y emisiones

Se prorratea. 
06-08-2021_Resolucion_202130400…


Para tu cotizador: CF típicamente depende del tipo/configuración del vehículo + supuestos de operación mensual (horas de operación/mes) que usa SICE-TAC. 
06-08-2021_Resolucion_202130400…


B) Costos variables (CV)
Se calculan por viaje/ruta y dependen del recorrido y del tipo de vehículo.

Fórmula general (del anexo):
CV = Combustible + Peajes + Llantas + Lubricantes + Filtros + Lavado/Engrase + Mantenimiento/Reparaciones 
06-08-2021_Resolucion_202130400…


Detalle por rubro (lo que debes modelar):

Combustible (ACPM)

Se calcula con:

precio oficial de ACPM (fuente MinMinas),

rendimiento (km/galón o equivalente) por tipo de vehículo,

distancia y tipo de terreno (afecta consumo),

fórmula de rendimiento/consumo por ruta. 
06-08-2021_Resolucion_202130400…


Peajes

Se calculan según ruta origen–destino y peajes reportados por fuentes oficiales (INVIAS/ANI, etc.). 
06-08-2021_Resolucion_202130400…


Llantas

Incluye consumo por km, número de llantas según configuración, vida útil, y precio de llanta (incluye llantas de tracción/direccional). 
06-08-2021_Resolucion_202130400…


Lubricantes

Calculado por consumo por km, cambios por kilometraje, etc. (incluye diferenciales / motor según tipología). 
06-08-2021_Resolucion_202130400…


Filtros

Similar: consumo asociado a mantenimientos por km y precios unitarios. 
06-08-2021_Resolucion_202130400…


Lavado y engrase

Consumo por km o por frecuencia (según uso) y precio del servicio. 
06-08-2021_Resolucion_202130400…


Mantenimiento y reparaciones

Rubro grande: usa un “indicador de consumo” por km (por tipo de vehículo) y precios de referencias. 
06-08-2021_Resolucion_202130400…


Para tu cotizador: CV depende directo de distancia, peajes, precio ACPM mensual, vehículo, y terreno.

C) “Otros costos” (OC)
El anexo define “otros costos” como los asociados a la facturación del viaje y a factores comerciales/operativos:

Fórmula general presentada:
OC = (1 − Factor administración − Comisión conductor − Factor prestacional …) × (CV + CF prorrateado + (variables/peajes))
(La idea: sumar base y luego aplicar factores porcentuales). 
06-08-2021_Resolucion_202130400…


Incluye explícitamente:

Factor de administración: porcentaje para el propietario/empresa por administración del servicio. 
06-08-2021_Resolucion_202130400…


Comisión / factor prestacional del conductor: porcentaje sobre el producido. 
06-08-2021_Resolucion_202130400…


Y otros factores que el anexo lista como porcentuales y de operación. 
06-08-2021_Resolucion_202130400…


6) Tipologías que aparecen (para estructurar tu catálogo)
El protocolo lista tipologías de carga y tipos de carrocería. Aparecen (como categorías):

Carga contenedores

Carga refrigerada

Carga en granel sólido

Carga en granel líquido

Carga general 
06-08-2021_Resolucion_202130400…


Y también clasifica por configuración vehicular (tablas por tipo: camión sencillo, doble troque, tractocamión, etc.). 
06-08-2021_Resolucion_202130400…


Recomendación exigente (para evitar cotizador “flojo”): si hoy solo cotizas “carga seca urbana”, crea un mapeo mínimo:

Vehículo (ej. NHR / liviano) → configuración SICE-TAC equivalente

Carrocería (caja seca / furgón) → “carga general”
y deja “contenedor/refrigerado/granel” como fases siguientes.

7) Checklist de implementación para tu cotizador (exacto y auditable)
Inputs mínimos (UI)
Origen (ciudad/nudo)

Destino (ciudad/nudo)

Tipo de vehículo / configuración

Tipo de carga/carrocería (al menos “carga general”)

Si aplica: terreno (auto o manual)

Fecha de cotización (para tomar ACPM/peajes del mes correcto)

Parámetros que debes versionar
Tabla de rendimientos por configuración/terreno

Tabla de vida útil / consumo de llantas, lubricantes, filtros

ACPM oficial mensual

Tabla de peajes por ruta (o integrarte a un servicio que los devuelva)

Costos fijos anuales (salario, seguros, impuestos, parqueadero, comunicaciones, RTM)
Todo con: fecha de vigencia + fuente + hash/snapshot. 
06-08-2021_Resolucion_202130400…


Output recomendado (para evitar pleitos)
Mostrar: Costo fijo prorrateado, Costo variable, Otros/administración, Total

Mostrar: “Metodología basada en SICE-TAC (MinTransporte). Parámetros actualizados a: [mes/año]” y un link/documento de soporte.

8) Punto crítico (te lo digo directo): cuidado con un supuesto oculto
El documento asume operación tipo “carretera” y parámetros promedio. Si tu cotizador es urbano (Bogotá, última milla, tráfico, tiempos muertos), si aplicas SICE-TAC “tal cual” puedes subestimar:

tiempos de cargue/descargue reales,

consumo en tráfico pesado,

costos por hora improductiva.

Alternativa robusta: usa SICE-TAC como piso de referencia + agrega un módulo urbano (factor de congestión/tiempo) como capa adicional, claramente separado del “cálculo SICE-TAC”.

Si quieres, en el siguiente mensaje te lo convierto en:

lista de variables exactas (nombres tipo backend),

fórmulas en pseudo-código,

estructura de tablas (DB) para versionar mensual/anual,
para que tu desarrollador lo implemente sin interpretación.


Fuentes

Dijiste:
hay un detalle que no tengo como el consumo por galon de lso vehiculos, necesito para mi cotizador tener costos concretos de la formula

ChatGPT dijo:

Pensado durante 23s
Perfecto—ahí está el hueco típico: sin “rendimiento (km/gal)” no puedes aterrizar el costo de combustible. Y aquí toca ser muy estrictos: no lo inventes, porque es el insumo más sensible y el que más te revienta el margen.

1) De dónde sacar un “consumo oficial” (para que tu cotizador tenga sustento)
En la metodología SICE-TAC, el combustible se calcula como:

Combustible (COP) = Precio ACPM (COP/gal) × Σ [ Distancia_tipoTerreno (km) ÷ Rendimiento_tipoTerreno (km/gal) ]

Eso mismo lo describe el protocolo (precio oficial + rendimiento por tipo de terreno + distancias por tramo). 

2) Valores concretos de rendimiento (km/gal) que puedes usar como base “tipo SICE-TAC clásico”
Hay una tabla ampliamente citada del “Modelo para determinación de costos de referencia” (MinTransporte) con rendimientos por terreno para configuraciones típicas:

Rendimiento en kilómetros por galón (ACPM) — Pavimentado

Plano: C2 9.5 | C3 9.7 | C3-S 5.4

Ondulado: C2 6.7 | C3 7.1 | C3-S 4.0

Montañoso: C2 4.6 | C3 4.9 | C3-S 2.8

Estos valores aparecen citados y replicados en una tesis Uniandes que referencia explícitamente el modelo del MinTransporte. 

(La misma tabla aparece también en documentos circulando como “SICETAC” en repositorios, consistente con lo anterior). 

¿Qué significa C2 / C3 / C3-S para tu caso?
C2 suele usarse como “camión rígido 2 ejes” (muchos livianos/medianos).

C3 “camión rígido 3 ejes”.

C3-S se usa para tracto + semirremolque (configuración más pesada).

👉 Para un NHR (2 ejes), tu default razonable en ausencia de tabla más específica es C2. Esto es una aproximación, no una afirmación legal; por eso tu sistema debe permitir “override” por flota/cliente.

3) Ojo: el protocolo 2024 mete “urbano” y “afirmado” (y ahí cambia el juego)
El protocolo actualizado menciona explícitamente que el rendimiento varía por plano, ondulado, montañoso, urbano y afirmado y que esos rendimientos están asociados por tipología vehicular en el sistema SICE-TAC. 

Punto crítico: la tabla “clásica” (9.5 / 6.7 / 4.6…) no incluye urbano, que para Bogotá es justamente donde más se distorsiona el consumo.

4) Cómo lo implementas ya, sin quedarte bloqueada
Opción A (rápida, usable hoy): “Modo carretera” + factor urbano
Usa la tabla C2/C3/C3-S para plano/ondulado/montañoso (arriba).

Si el viaje es urbano (o tiene componente urbano), aplica un factor de castigo:

Rendimiento_urbano = Rendimiento_plano × (0.55 a 0.75) como rango configurable (no fijo).

Guardas en la cotización:

rendimiento usado (km/gal),

factor urbano aplicado,

versión de parámetros.

Esto te da costos concretos, pero con trazabilidad y sin venderlo como “dato oficial exacto”.

Opción B (la correcta si quieres postura “legalmente sólida”):
Extraer el rendimiento por tipología desde el SICE-TAC actualizado (o desde su anexo oficial si está publicado con tablas completas).

Ventaja: “cálculo alineado a SICE-TAC”.

Desventaja: requiere integración/descarga periódica y versionado.

5) Qué campos EXACTOS debes meter en tu base de datos (para que no se vuelva un Excel)
Crea tabla fuel_efficiency:

vehicle_class (C2/C3/C3S o tu tipología interna)

terrain_type (PLANO, ONDULADO, MONTAÑOSO, URBANO, AFIRMADO)

km_per_gal

source (ej. “Modelo costos referencia MinTransporte 2011 / Protocolo SICE-TAC 2024”)

valid_from, valid_to

notes (si es aproximación / factor)

6) Siguiente paso (para cerrarlo bien)
Dime qué vehículos/configuraciones vas a soportar en el MVP del cotizador (ej: NHR, NPR, furgón 2 ejes, 3 ejes, tracto), y si tu cotizador será:

100% urbano Bogotá, o

urbano + carretera.

Con eso te devuelvo una tabla inicial completa (por tipología) + reglas de “urbano” para que tengas costos concretos desde ya y un camino claro para migrar a valores SICE-TAC 2024 cuando los extraigas.


Dijiste:
bueno pero eso era un ejemplo, necesto este nivel de detalel o lmas para todos lso calculos, es decir la formula debe estar basada en valroes concretos, necesto hacer mis tabals de tasas  para esto

ChatGPT dijo:

Pensado durante 4m 0s
Perfecto. Y te lo digo como mentor exigente: si tu cotizador no está alimentado por “tablas de parámetros” con valores concretos y versionados, no es un cotizador: es una calculadora con supuestos ocultos (y ahí es donde nacen los reclamos y los márgenes fantasmas).

Te dejo las tasas/valores concretos que SÍ están explícitos en tu PDF, y luego la estructura exacta de tablas que necesitas crear para completar lo que el documento deja como “precio/mercado/ICTC”. Todo sale de la Resolución 20213040034405 (06-08-2021) y su anexo/protocolo. 
06-08-2021_Resolucion_202130400…


1) Tablas “duras” (valores numéricos ya definidos en el documento)
1.1. Parámetros operativos base
Horas hábiles de operación al mes (H_mes): 288 horas/mes
(Equivale a 24 días × 12 horas/día). 
06-08-2021_Resolucion_202130400…


Velocidad promedio por tipo de terreno (km/h) 
06-08-2021_Resolucion_202130400…


Configuraciones: C2 (camión rígido 2 ejes), C3 (rígido 3 ejes), C2S2, C2S3, C3S2, C3S3 (tracto + semirremolque)

Terreno: P (plano), O (ondulado), M (montañoso)

Configuración	P	O	M
C2	53.00	30.00	15.00
C3	56.59	32.94	18.65
C2S2	63.04	32.95	25.81
C2S3	63.04	32.95	18.65
C3S2	56.23	33.13	23.57
C3S3	56.23	33.13	23.57
Tiempo de recuperación del capital (n meses) 
06-08-2021_Resolucion_202130400…


C2: 10 años = 120 meses

C3 / C2S2 / C2S3 / C3S2 / C3S3: 16 años = 192 meses

1.2. Combustible: la tabla que te faltaba (km/galón)
El documento te da la tabla de rendimiento (km/gal) por terreno y configuración. 
06-08-2021_Resolucion_202130400…


Configuración	P (km/gal)	O (km/gal)	M (km/gal)
C2	12.70	10.10	7.81
C3	8.00	6.22	4.66
C2S2	8.76	6.76	5.07
C2S3	8.76	6.76	5.07
C3S2	6.80	5.04	3.42
C3S3	6.48	4.80	3.26
Y la fórmula que debes implementar: 
06-08-2021_Resolucion_202130400…


IndicadorConsumoTerreno = PrecioACPM (COP/gal) / RendimientoTerreno (km/gal)

Combustible = Σ [IndicadorConsumoTerreno × DistanciaTerreno(km)]

Nota crítica: el precio de ACPM se toma mensual con referencia Bogotá (fuente MinMinas) — tú lo debes cargar/actualizar mensualmente. 
06-08-2021_Resolucion_202130400…


1.3. Costos fijos: fórmulas + tasas numéricas que sí define el PDF
Fórmula general CF por viaje 
06-08-2021_Resolucion_202130400…


C
F
_
v
i
a
j
e
=
S
e
g
u
r
o
s
+
S
a
l
a
r
i
o
s
+
P
a
r
q
u
e
a
d
e
r
o
+
I
m
p
u
e
s
t
o
s
+
C
o
m
u
n
i
c
a
c
i
o
n
e
s
+
R
T
M
+
C
a
p
i
t
a
l
N
_
v
i
a
j
e
s
_
m
e
s
CF_viaje= 
N_viajes_mes
Seguros+Salarios+Parqueadero+Impuestos+Comunicaciones+RTM+Capital
​
 
Impuestos (tasa explícita): 
06-08-2021_Resolucion_202130400…


I
m
p
u
e
s
t
o
s
_
m
e
s
=
0.005
×
V
a
l
o
r
V
e
h
i
c
u
l
o
12
Impuestos_mes= 
12
0.005×ValorVehiculo
​
 
(0.5% anual prorrateado mensual)

Parqueadero: 
06-08-2021_Resolucion_202130400…


P
a
r
q
u
e
a
d
e
r
o
_
m
e
s
=
P
r
e
c
i
o
P
a
r
q
u
e
a
d
e
r
o
N
o
c
h
e
×
30
Parqueadero_mes=PrecioParqueaderoNoche×30
Salarios – factor prestacional (valor explícito): 55.68% 
06-08-2021_Resolucion_202130400…


Define jornada: factor 1 (8h) y factor 0.5 (4h); total 1.5 (=12h/día).

Fórmula mostrada en el documento (la implementas tal cual):

S
a
l
a
r
i
o
s
=
(
1.5
×
S
M
L
M
V
×
(
1
+
0.5568
)
)
+
G
a
s
t
o
C
o
n
d
u
c
t
o
r
S
u
p
l
e
n
t
e
M
e
s
Salarios=(1.5×SMLMV×(1+0.5568))+GastoConductorSuplenteMes
G
a
s
t
o
C
o
n
d
u
c
t
o
r
S
u
p
l
e
n
t
e
M
e
s
=
0.5
×
S
M
L
M
V
×
(
1
+
0.5568
)
12
GastoConductorSuplenteMes= 
12
0.5×SMLMV×(1+0.5568)
​
 

06-08-2021_Resolucion_202130400…


Capital (recuperación): usa la tasa “interés bancario” del Banco de la República y el período (120/192). El PDF te deja la fórmula tipo “cuota” (PMT) sobre f × valor del vehículo. 
06-08-2021_Resolucion_202130400…


👉 Aquí te falta un dato clave: f (valor a recuperar / porcentaje del valor del vehículo) no viene como número fijo en estas páginas; el sistema lo “establece anualmente” con base en valores comerciales. Eso lo vuelves una tabla tuya (ver sección 2).

1.4. Costos variables: porcentaje explícito para “imprevistos”
Imprevistos = 7.5% de (llantas + lubricantes + filtros + mantenimiento + lavado/engrase), sin incluir combustible ni peajes. 
06-08-2021_Resolucion_202130400…


I
m
p
r
e
v
i
s
t
o
s
=
0.075
×
(
L
l
a
n
t
a
s
+
L
u
b
r
i
c
a
n
t
e
s
+
F
i
l
t
r
o
s
+
M
a
n
t
e
n
i
m
i
e
n
t
o
+
L
a
v
a
d
o
E
n
g
r
a
s
e
)
Imprevistos=0.075×(Llantas+Lubricantes+Filtros+Mantenimiento+LavadoEngrase)
1.5. Otros costos (OC): factores porcentuales explícitos (los legales/tributarios)
El documento define OC como factor porcentual aplicado sobre (CV + CF): 
06-08-2021_Resolucion_202130400…


O
C
=
(
1
+
F
_
a
d
m
i
n
)
×
(
C
V
+
C
F
)
(
1
−
C
o
m
i
s
i
o
n
C
o
n
d
u
c
t
o
r
−
F
a
c
t
o
r
P
r
e
s
t
a
c
i
o
n
a
l
−
R
e
t
e
I
C
A
−
R
e
t
e
F
u
e
n
t
e
)
OC= 
(1−ComisionConductor−FactorPrestacional−ReteICA−ReteFuente)
(1+F_admin)×(CV+CF)
​
 
Y fija estos valores:

Factor de administración (F_admin): 5% 
06-08-2021_Resolucion_202130400…


Comisión del conductor: 8% 
06-08-2021_Resolucion_202130400…


Factor prestacional sobre comisión: 1.5569 (multiplicador). El mismo PDF muestra que 8% × 1.5569 = 12.4552%. 
06-08-2021_Resolucion_202130400…


Retención ICA: 3% 
06-08-2021_Resolucion_202130400…


Retención en la fuente: 1% 
06-08-2021_Resolucion_202130400…


Chequeo rápido (para evitar errores de implementación):
Denominador = 1 − 0.08 − 0.124552 − 0.03 − 0.01 = 0.755448
Ese 0.755448 debe quedarte igual en tu motor si usas los mismos factores.

2) Lo que el PDF NO te da como número fijo (y por eso necesitas tus tablas)
Para llantas, lubricantes, filtros, lavado/engrase, mantenimiento, el protocolo solo te deja el esqueleto matemático: precio, cantidad, duración (km) y luego lo vuelve “COP por km” multiplicado por distancia. 
06-08-2021_Resolucion_202130400…


Ejemplo (llantas): 
06-08-2021_Resolucion_202130400…


IndicadorConsumoLlantas_i = (PrecioLlantai × CantidadLlantai) / DuraciónLlantai(km)

Llantas = (Σ Indicadores_i) × DistanciaRuta(km)

✅ Conclusión: tus “tablas de tasas” deben incluir Precio, Cantidad y Duración por tipología. Sin eso, no hay costo concreto.

3) Estructura exacta de tablas que debes crear (MVP sólido + auditable)
Te propongo estas tablas mínimas (y cómo se calculan). Si las armas así, tu cotizador queda estable, trazable y escalable.

3.1. vehicle_config
config_id (C2, C3, C2S2, C2S3, C3S2, C3S3)

axles

description

(Esta sale del documento). 
06-08-2021_Resolucion_202130400…


3.2. terrain_params
terrain (P/O/M)

avg_speed_kmh por config_id ✅ (tabla 1.1)

fuel_km_per_gal por config_id ✅ (tabla 1.2)

3.3. capital_params
config_id

recovery_months ✅ (120/192)

interest_monthly (tasa BR, la cargas anual o mensual según tu criterio)

recoverable_factor_f (tu tabla, porque el PDF no la fija como número único)

vehicle_value (o lo traes de guía de valores)

3.4. fixed_costs_annual
Versionada por año (year)

smlmv

salary_prestational = 0.5568 ✅

insurance_soat_annual (por config)

insurance_allrisk_annual (por config)

rtm_annual (por config)

communications_monthly (o anual prorrateado)

parking_night_price_by_city (si quieres por ciudad)

tax_rate_annual = 0.005 ✅

3.5. variable_cost_rates
Versionada por mes (yyyymm)

acpm_price_cop_per_gal ✅ (input mensual)

tolls_by_route (suma de peajes por corredor o lista por peaje)

imprevistos_rate = 0.075 ✅

tire_price_*, tire_qty_*, tire_life_km_* por config

lubricant_price/qty/life_km por tipo (motor/caja/diferencial) y config

filter_price/qty/life_km por tipo y config

wash_grease_price y wash_grease_frequency_km (o “duración” en km) por config

maintenance_parts_cost + labor_cost + life_km por “familia” (si lo simplificas, una sola tasa COP/km por config)

3.6. other_cost_factors
admin_factor = 0.05 ✅

driver_commission = 0.08 ✅

commission_prestational_multiplier = 1.5569 ✅

rete_ica = 0.03 ✅

rete_fuente = 0.01 ✅

4) Motor de cálculo (orden exacto para que no te enredes)
Para una cotización:

Separas distancia total en km_plano, km_ondulado, km_montañoso (como hace SICE-TAC). 
06-08-2021_Resolucion_202130400…


CV

Combustible (con km/gal por terreno)

Peajes (suma ruta)

Llantas + Lubricantes + Filtros + LavadoEngrase + Mantenimiento (cada uno COP/km × distancia)

Imprevistos = 7.5% de los anteriores (sin fuel/peajes)

CF_viaje

Calculas costos fijos mensuales (salarios, seguros/12, rtm/12, comunicaciones, parqueadero, impuestos, capital)

Divides por N_viajes_mes

OC usando la fórmula con factores

Total = OC (que ya incorpora CV+CF ajustado)

5) Lo que necesito que decidas (sin preguntas eternas, pero sí con precisión)
Para armarte las tablas listas para pegar en Excel/BD me basta con que definas el MVP así:

¿Qué configuraciones vas a cotizar primero? (por ejemplo: C2 únicamente si tu MVP es NHR/NPR urbanos).

¿Vas a permitir seleccionar terreno P/O/M o lo inferimos por ruta? (si es urbano puro, esto cambia).

¿Cómo vas a definir N_viajes_mes? (en SICE-TAC depende de operación; si no lo defines, CF_viaje queda inflado o subestimado).

Mientras me respondes eso, ya te dejo algo accionable:

✅ Si tu MVP es C2 (NHR / 2 ejes), hoy mismo puedes cargar:

km/gal P/O/M: 12.70 / 10.10 / 7.81

velocidades P/O/M: 53 / 30 / 15

n = 120 meses

impuestos = 0.005 × valor / 12

prestacional salario = 55.68%

imprevistos = 7.5%

admin = 5%, comisión = 8%, reteICA = 3%, retefuente = 1%, prestacional comisión = 1.5569

Todo eso está textual en el PDF. 
06-08-2021_Resolucion_202130400…


Si quieres, en el siguiente mensaje te lo entrego en formato tabla CSV/Excel (columnas y filas exactas) para que solo copies/pegues a tu base de datos o a tu sheet.


Fuentes




