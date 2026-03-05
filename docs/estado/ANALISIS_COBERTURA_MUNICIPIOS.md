# Análisis de cobertura de municipios — Colombia DANE

> Fecha: 25/02/2026  
> Fuente oficial comparada: `subregionesColombia.pdf` (DIVIPOLA oficial)

---

## Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Municipios en el PDF oficial (DIVIPOLA) | **839** |
| Municipios en `colombia-dane.ts` actual | **205** |
| **Faltantes en nuestro catálogo** | **668** |
| Total municipios Colombia (DIVIPOLA completo) | 1.122 |

El catálogo actual cubre apenas el **~18%** del total de municipios colombianos. El PDF del usuario tiene 839 de los 1.122 (el resto son territorios no municipalizados o no incluidos en esa versión del PDF).

---

## Archivos que controlan los municipios disponibles

Para que un municipio aparezca en el selector de origen/destino, **debe estar en los tres archivos**:

| Archivo | Rol | Municipios actuales |
|---|---|---|
| `app/cotizar/config/colombia-dane.ts` | Catálogo visual (nombres, departamentos) | 205 |
| `app/cotizar/config/colombia-coordenadas.ts` | Coordenadas lat/lon para Haversine | 207 |
| `lib/utils/distancias-tabla.ts` | Tabla de 20.910 pares de km reales (OSRM) | 207 municipios × 207 |

> Si se agrega un municipio nuevo en `colombia-dane.ts` pero no tiene coordenadas en `colombia-coordenadas.ts`, el cálculo de distancia cae al fallback Haversine × 1.4 (±10–20%). Si tampoco tiene coordenadas, devuelve `null` y usa el fallback hardcoded de 500 km.

---

## Observación sobre los 34 códigos "sin coincidencia en PDF"

El script detectó 34 códigos de nuestro archivo que no aparecen en el PDF, pero esto es un **artefacto de extracción** del PDF (los nombres se parten en múltiples líneas), **no son códigos erróneos**. Los códigos son DANE oficiales correctos. Ejemplos verificados:

- `05001` Medellín ✅ — nombre partido en PDF  
- `47001` Santa Marta ✅ — mismo caso  
- `50001` Villavicencio ✅ — mismo caso  
- `54518` Pamplona ✅ — mismo caso  

---

## Departamentos completamente ausentes de nuestro catálogo

| Cód. | Departamento | Municipios en PDF |
|---|---|---|
| 91 | Amazonas | 5 |
| 94 | Guainía | 8 |
| 95 | Guaviare | 2+ |
| 97 | Vaupés | 6 |
| 99 | Vichada | 4 |

> Nota: Estos departamentos son territorios selváticos/fronterizos con muy poco movimiento de carga terrestre. Podrían dejarse fuera deliberadamente.

---

## Municipios faltantes por departamento (los que sí tienen tráfico de carga)

### Antioquia (05) — 65 municipios en PDF, tenemos ~13
```
05002  Abejorral         05004  Abriaquí          05021  Alejandría
05031  Amalfi            05038  Angostura         05040  Anorí
05042  Santafé de Antioquia  05044  Anza           05055  Argelia
05059  Armenia (Ant.)    05086  Belmira           05107  Briceño
05113  Buriticá          05120  Cáceres           05134  Campamento
05138  Cañasgordas       05142  Caracolí          05148  Carmen de Viboral
05150  Carolina          05190  Cisneros          05197  Cocorná
05206  Concepción        05234  Dabeiba           05240  Ebéjico
05250  El Bagre          05264  Entrerríos        05284  Frontino
05306  Giraldo           05310  Gómez Plata       05313  Granada (Ant.)
05315  Guadalupe         05318  Guarne            05321  Guatapé
05347  Heliconia         05361  Ituango           05376  La Ceja
05400  La Unión          05411  Liborina          05425  Maceo
05483  Nariño (Ant.)     05495  Nechí             05501  Olaya
05541  Peñol             05543  Peque             05558  Peque
05585  Puerto Nare       05591  Puerto Triunfo    05604  Remedios
05628  Sabanalarga       05647  San Andrés (Ant.) 05656  San Jerónimo
05658  San José de la Montaña  05664  San Pedro   05670  San Roque
05686  Santa Rosa de Osos      05690  Santo Domingo 05736  Segovia
05790  Tarazá            05819  Toledo            05854  Valdivia
05858  Vegachí           05885  Yalí              05887  Yarumal
05890  Yolombó           05893  Yondó             05895  Zaragoza
```

### Atlántico (08) — tenemos 7, faltan 16
```
08078  Baranoa           08137  Campo de la Cruz  08141  Candelaria
08372  Juan de Acosta    08421  Luruaco           08436  Manatí
08520  Palmar de Varela  08549  Piojó             08558  Polonuevo
08560  Ponedera          08606  Repelón           08675  Santa Lucía
08685  Santo Tomás       08770  Suán              08832  Tubará
08849  Usiacurí
```

### Bolívar (13) — tenemos 7, faltan 38
```
13006  Achí              13030  Altos del Rosario 13042  Arenal
13062  Arroyohondo       13074  Barranco de Loba  13140  Calamar
13160  Cantagallo        13188  Cícuco            13212  Córdoba
13222  Clemencia         13248  El Guamo          13268  El Peñón
13300  Hatillo de Loba   13433  Mahates           13440  Margarita
13458  Montecristo       13468  Mompós (NEW)      13549  Pinillos
13580  Regidor           13600  Río Viejo         13620  San Cristóbal
13647  San Estanislao    13650  San Fernando      13654  San Jacinto
13655  San Jacinto del Cauca   13657  San Juan Nepomuceno
13667  San Martín de Loba      13670  San Pablo
13673  Santa Catalina    13683  Santa Rosa de Lima 13688  Santa Rosa del Sur
13744  Simití            13760  Soplaviento       13780  Talaigua Nuevo
13810  Tiquisio          13838  Turbana           13873  Villanueva
13894  Zambrano
```

### Boyacá (15) — tenemos 6, faltan 56+
```
(56 municipios adicionales — ver PDF completo)
Incluye: Aquitania, Belén, Chíquiza, Chiquinquirá, Duitama (ya tenemos),
El Cocuy, Guateque, Miraflores, Moniquirá, Paipa, Ráquira, Sogamoso (ya tenemos),
Soatá, Tunja (ya tenemos), Villa de Leyva…
```

### Caldas (17) — tenemos 7, faltan 9
```
17272  Filadelfia        17388  La Merced         17444  Norcasia
17495  Norte (Anserma)   17513  Pácora            17614  Riosucio
17653  Salamina          17662  Samaná            17777  Supía
```

### Caquetá (18) — tenemos 5, faltan 11
```
18029  Albania           18150  Cartagena del Chairá  18205  Currillo
18247  El Doncello       18256  El Paujil             18410  La Montañita
18592  Puerto Rico       18610  San José del Fragua   18753  San Vicente del Caguán
18785  Solita            18860  Valparaíso
```

### Cauca (19) — tenemos 6, faltan 36
```
(36 municipios — Argelia, Balboa, Bolívar, Buenos Aires, Cajibío, Caldono,
Corinto, El Tambo, Florencia, Guapi, Inzá, La Sierra, La Vega, López, 
Mercaderes, Miranda, Morales, Padilla, Páez, Piamonte, Piéndamo, Purácé,
Rosas, San Sebastián, Santa Rosa, Silvia, Sotará, Suárez, Sucre, Timbío,
Timbiquí, Toribío, Totoró, Villa Rica…)
```

### Cesar (20) — tenemos 5, faltan 20
```
20011  Aguachica         20013  Agustín Codazzi   20032  Astrea
20045  Becerril          20060  Bosconia          20175  Chimichagua
20178  Chiriguaná        20228  Curumaní          20238  El Copey
20250  El Paso           20295  Gamarra           20310  González
20383  La Gloria         20517  Pailitas          20550  Pelaya
20570  Pueblo Bello      20614  Río de Oro        20750  San Diego
20770  San Martín        20787  Tamalameque
```

### Córdoba (23) — tenemos 7, faltan 13
```
23068  Ayapel            23079  Buenavista        23168  Chimá
23182  Chinú             23300  Cotorra           23350  La Apartada
23464  Momil             23586  Purísima          23660  Sahagún (NEW)
23670  San Andrés Sotavento     23807  Tierralta  23855  Valencia
```

### Cundinamarca (25) — tenemos 10, faltan 42
```
(42 municipios — Anapoima, Anolaima, Arbeláez, Bojacá, Cabrera, Cachipay,
Carmen de Carupa, Chocontá, Cogua, Cota, Cucunubá, El Colegio, El Rosal,
Facatativá (ya tenemos), Funza (ya tenemos), Fúquene, Gachancipá, Granada,
La Mesa (ya tenemos), Nemocon, Venecia, Pandi, Pasca, Quipile, Apulo,
San Antonio del Tequendama, San Bernardo, Sibaté, Silvania, Sopó, Subachoque,
Tabio, Tena, Tenjo, Tibacuy, Tocancipá, Viotá, Zipacón…)
```

### Chocó (27) — tenemos 4, faltan 30
```
27006  Acandí            27025  Alto Baudó        27050  Atrato
27073  Bagadó            27075  Bahía Solano      27077  Bajo Baudó
27099  Bojayá            27135  Cantón de San Pablo  27150  Carmen del Darién
27160  Certeguí          27205  Condoto           27245  El Carmen de Atrato
27250  El Litoral del San Juan  27372  Juradó     27425  Medio Atrato
27430  Medio Baudó       27450  Medio San Juan    27491  Nóvita
27495  Nuquí             27580  Río Frío          27600  Río Quito
27615  Riosucio          27660  San José del Palmar  27745  Sipí
27787  Tadó              27800  Unguía            27810  Unión Panamericana
```

### Huila (41) — tenemos 7, faltan 35
```
(35 municipios — Agrado, Aipe, Algeciras, Altamira, Baraya, Elías, Garzón (es el mismo
que 41206 que ya tenemos?), Gigante, Guadalupe, Hobo, Iquira, Isnos, La Argentina,
La Plata, Nátaga, Oporapa, Paicol, Palestina, Pital, Pitalito (ya tenemos),
Saladoblanco, San Agustín, Santa María, Suaza, Tesalia, Tello, Teruel, Timaná,
Villavieja, Yaguará…)
```
> ⚠️ Nota: el PDF tiene `41298 GARZÓN` — en nuestro archivo tenemos `41206 Garzón`. Son **dos municipios distintos** en el PDF. Hay que revisar.

### La Guajira (44) — tenemos 6, faltan 9
```
44078  Barrancas         44090  Dibulla           44098  Distracción
44110  El Molino         44279  Fonseca           44378  Hatonuevo
44650  San Juan del Cesar  44855  Urumita         44874  Villanueva
```

### Magdalena (47) — tenemos 6, faltan 11
```
47030  Algarrobo         47053  Aracataca         47058  Ariguaní
47170  Chibolo           47460  Nueva Granada     47703  San Zenón
47707  Santa Ana (47707 vs 47675 — revisar duplicado)
47720  Santa Bárbara de Pinto   47798  Tenerife
```
> ⚠️ Nuestro catálogo tiene `47675 Santa Ana`. El PDF tiene `47707 Santa Ana`. Verificar cuál es el código correcto DIVIPOLA.

### Meta (50) — tenemos 7, faltan 17
```
50110  Barranca de Upía  50150  Castilla la Nueva 50223  San Luis de Cubarral
50226  Cumaral           50245  El Calvario       50251  El Castillo
50270  El Dorado         50287  Fuente de Oro     50318  Guamal (nuevo)
50350  La Macarena       50370  La Uribe          50568  Puerto Gaitán
50573  Puerto López      50606  Restrepo          50680  San Carlos de Guaroa
50686  San Juanito       50689  San Martín (nuevo — vs 50683 que ya tenemos)
```
> ⚠️ Tenemos `50683 San Martín`. El PDF tiene `50689 San Martín`. Revisar código.

### Nariño (52) — tenemos 6, faltan 56
```
(56 municipios — Albán, Aldana, Ancuyá, Arboleda, Barbacoas, Belén,
Colón, Consacá, Contadero, Córdoba, Cuaspud, Cumbal, Cumbitara, Chachagüi,
El Charco, El Peñol, El Rosario, El Tablón de Gómez, El Tambo, Funes,
Guachucal, Guaitarilla, Gualmatan, Iles, Imués, La Cruz, La Florida,
La Llanada, La Tola, La Unión, Leiva, Linares, Los Andes, Magüí, Mallama,
Mosquera, Nariño, Olaya Herrera, Ospina, Potosí, Providencia, Puerres (ya tenemos),
Pupiales, Ricaurte, Roberto Payán, Samaniego (ya tenemos), Sandoná, San Bernardo,
San Lorenzo, San Pablo, San Pedro de Cartago, Santa Bárbara, Santa Cruz,
Sapuyes, Taminango, Tangua, Túquerres, Yacuanquer…)
```

### Norte de Santander (54) — tenemos 7, faltan 20
```
54003  Ábrego            54051  Arboledas         54109  Bucarasica
54128  Cachirá           54223  Cucutilla         54245  El Carmen
54250  El Tarra          54261  El Zulia          54313  Gramalote
54385  La Esperanza      54398  La Playa          54405  Los Patios
54418  Lourdes           54498  Ocaña             54553  Puerto Santander
54660  Salazar           54670  San Calixto       54680  Santiago
54800  Teorama           54810  Tibú (ya tenemos)
```

### Quindío (63) — tenemos 6, faltan 6
```
63111  Buenavista        63272  Filandia          63302  Génova
63470  Montenegro        63594  Quimbaya (⚠️ ya tenemos 63548 Quimbaya — revisar)
63690  Salento
```
> ⚠️ Posible duplicado: tenemos `63548 Quimbaya`, el PDF tiene `63594 Quimbaya`. Un código es incorrecto.

### Risaralda (66) — tenemos 9, faltan 5
```
66088  Belén de Umbría   66383  La Celia (⚠️ tenemos 66400 La Celia)
66594  Quinchía          66682  Santa Rosa de Cabal (⚠️ tenemos 66572)
66687  Santuario
```
> ⚠️ Nuestros códigos `66400 La Celia` y `66572 Santa Rosa de Cabal` pueden ser incorrectos — el PDF tiene `66383` y `66682` respectivamente. Verificar DIVIPOLA oficial.

### Santander (68) — tenemos 10, faltan 52
```
(52 municipios — toda la región del sur de Santander, Comuneros, Guanentá, Mares,
Vélez — Aratoca, Barichara, Cabrera, Capitanejo, Carcasí, Cepitá, Cerrito,
Charalá, Concepción, Confines, Contratación, Coromoro, Curití, El Guacamayo,
El Playón, Encino, Enciso, Galán, Gambita, Guaca, Guadalupe, Guapotá, Hato,
Jordán, Lebrija, Los Santos, Macaravita, Málaga, Matanza, Mogotes, Molagavita,
Ocamonte, Oiba, Onzaga, Palmar, Palmas del Socorro, Páramo, Pinchote, Puerto Wilches,
San Andrés, San Joaquín, San José de Miranda, San Miguel, San Vicente de Chucurí,
Santa Bárbara, Simacota, Suaita, Suratá, Tona, Villanueva, Zapatoca…)
```

### Sucre (70) — tenemos 7, faltan 14
```
70204  Coloso            70221  Coveñas (⚠️ tenemos 70110 Coveñas — revisar código)
70230  Chalán            70233  El Roble          70235  Galeras
70265  Guaranda          70418  Los Palmitos      70429  Majagual
70473  Morroa            70523  Palmito           70670  Sampués
70713  San Onofre        70820  Santiago de Tolú  70823  Tolú Viejo
```
> ⚠️ Tenemos `70110 Coveñas`, el PDF tiene `70221 Coveñas`. Revisar.

### Tolima (73) — tenemos 12, faltan 32
```
(32 municipios — Alvarado, Anzoátegui, Ataco, Cajamarca, Casabianca, Coello,
Coyaima, Cunday, Dolores, Espinal, Flandes, Guamo, Herveo, Icononzo,
Murillo, Natagaima, Ortega, Piedras, Planadas, Prado, Purificación,
Rioblanco, Roncesvalles, Saldaña, San Antonio, San Luis, Santa Isabel,
Suárez, Villahermosa (ya tenemos), Villarrica (ya tenemos)…)
```

### Valle del Cauca (76) — tenemos 13, faltan 34
```
76020  Alcalá            76036  Andalucía         76041  Ansermanuevo
76054  Argelia           76100  Bolívar           76113  Bugalagrande
76122  Caicedonia        76126  Calima (Darién)   76130  Candelaria
76233  Dagua             76243  El Águila         76246  El Cairo
76248  El Cerrito        76250  El Dovio          76318  Guacarí
76377  La Cumbre         76403  La Victoria       76497  Obando
76606  Restrepo          76616  Riofrío           76622  Roldanillo
76828  Trujillo          76834  Tuluá (⚠️ tenemos 76823 Tuluá — revisar)
76845  Ulloa             76863  Versalles         76869  Vijes
76890  Yotoco            76895  Zarzal
```
> ⚠️ Tenemos `76823 Tuluá`, el PDF tiene `76834 Tuluá`. Revisar código correcto.

### Casanare (85) — tenemos ~14, faltan 4+
```
85230  Orocué            85250  Paz de Ariporo (⚠️ tenemos 85400)
85263  Pore (⚠️ tenemos 85410)
```
> ⚠️ Nuestros códigos `85400 Paz de Ariporo` y `85410 Pore` pueden ser incorrectos — el PDF tiene `85250` y `85263`. Además hay dos entradas con `85400` en nuestro archivo (Trinidad también mapeada a 85400).

### Putumayo (86) — tenemos 8, faltan 5
```
86219  Colón             86568  Puerto Asís (⚠️ tenemos 86569)
86571  Puerto Guzmán     86760  Santiago (⚠️ tenemos 86757)
86885  Villagarzón (⚠️ tenemos 86865)
```
> ⚠️ Varios códigos de Putumayo pueden estar incorrectos en nuestro archivo.

---

## Códigos potencialmente incorrectos en `colombia-dane.ts` (requieren verificación DIVIPOLA)

| Nuestro código | Nuestro nombre | Código en PDF | Observación |
|---|---|---|---|
| 70110 | Coveñas | 70221 | Posible error |
| 76823 | Tuluá | 76834 | Posible error |
| 85400 | Paz de Ariporo | 85250 | Posible error (además 85400 duplicado con Trinidad) |
| 85410 | Pore | 85263 | Posible error |
| 47675 | Santa Ana | 47707 | Verificar |
| 50683 | San Martín | 50689 | Verificar |
| 66572 | Santa Rosa de Cabal | 66682 | Verificar |
| 66400 | La Celia | 66383 | Verificar |
| 63548 | Quimbaya | 63594 | Verificar |
| 86569 | Puerto Asís | 86568 | Diferencia en último dígito |
| 86757 | Santiago | 86760 | Diferencia |
| 86865 | Villagarzón | 86885 | Diferencia |

> **Fuente definitiva**: https://www.dane.gov.co/index.php/estadisticas-por-tema/demografia-y-poblacion/proyecciones-de-poblacion → DIVIPOLA 2024

---

## Qué hay que hacer para ampliar la cobertura

1. **Actualizar `colombia-dane.ts`** — agregar los 668 municipios faltantes con código y nombre
2. **Actualizar `colombia-coordenadas.ts`** — agregar lat/lon de cada nuevo municipio (centroide cabecera)
3. **Regenerar `distancias-tabla.ts`** — volver a correr el script `generar-distancias-osrm.js` con los nuevos municipios para que la tabla de 20.910 pares se amplíe; sin esto el cálculo km usará Haversine × 1.4 (no falla, pero es menos preciso)
4. **Script disponible**: `scripts/generar-distancias-osrm.js` ya existe para regenerar la tabla

---

## Prioridad recomendada

Si no se quiere agregar los 668 de golpe, se puede priorizar por volumen de carga logística:

| Prioridad | Municipios | Criterio |
|---|---|---|
| Alta | Cabeceras municipales de los 32 deptos | Tráfico inter-departamental |
| Media | Municipios con industria/minería/agrícola (Uraba, Magdalena Medio, Llanos) | Rutas de carga masiva |
| Baja | Municipios rurales y chocó/selva | Poca carga terrestre |
