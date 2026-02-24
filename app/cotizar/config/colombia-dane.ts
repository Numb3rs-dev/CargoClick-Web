/**
 * Datos geográficos de Colombia con códigos DANE
 *
 * Fuente: DANE - Divipola
 * Departamentos: código 2 dígitos
 * Municipios: código 5 dígitos (DD + MMM)
 *
 * Solo incluye municipios relevantes para transporte de carga (logística nacional).
 */

export interface Municipio {
  /** Código DANE 5 dígitos */
  codigo: string;
  nombre: string;
}

export interface Departamento {
  /** Código DANE 2 dígitos */
  codigo: string;
  nombre: string;
  municipios: Municipio[];
}

export const DEPARTAMENTOS: Departamento[] = [
  {
    codigo: '11',
    nombre: 'Bogotá D.C.',
    municipios: [
      { codigo: '11001', nombre: 'Bogotá D.C.' },
    ],
  },
  {
    codigo: '05',
    nombre: 'Antioquia',
    municipios: [
      { codigo: '05001', nombre: 'Medellín' },
      { codigo: '05088', nombre: 'Bello' },
      { codigo: '05237', nombre: 'Envigado' },
      { codigo: '05360', nombre: 'Itagüí' },
      { codigo: '05615', nombre: 'Sabaneta' },
      { codigo: '05607', nombre: 'Rionegro' },
      { codigo: '05045', nombre: 'Apartadó' },
      { codigo: '05748', nombre: 'Turbo' },
      { codigo: '05154', nombre: 'Caucasia' },
      { codigo: '05579', nombre: 'Puerto Berrío' },
      { codigo: '05380', nombre: 'La Estrella' },
      { codigo: '05440', nombre: 'Marinilla' },
      { codigo: '05659', nombre: 'Santa Fe de Antioquia' },
    ],
  },
  {
    codigo: '08',
    nombre: 'Atlántico',
    municipios: [
      { codigo: '08001', nombre: 'Barranquilla' },
      { codigo: '08758', nombre: 'Soledad' },
      { codigo: '08433', nombre: 'Malambo' },
      { codigo: '08573', nombre: 'Puerto Colombia' },
      { codigo: '08638', nombre: 'Sabanalarga' },
      { codigo: '08296', nombre: 'Galapa' },
      { codigo: '08634', nombre: 'Sabanagrande' },
    ],
  },
  {
    codigo: '13',
    nombre: 'Bolívar',
    municipios: [
      { codigo: '13001', nombre: 'Cartagena' },
      { codigo: '13430', nombre: 'Magangué' },
      { codigo: '13836', nombre: 'Turbaco' },
      { codigo: '13244', nombre: 'El Carmen de Bolívar' },
      { codigo: '13052', nombre: 'Arjona' },
      { codigo: '13473', nombre: 'Mompós' },
      { codigo: '13442', nombre: 'María la Baja' },
    ],
  },
  {
    codigo: '15',
    nombre: 'Boyacá',
    municipios: [
      { codigo: '15001', nombre: 'Tunja' },
      { codigo: '15759', nombre: 'Sogamoso' },
      { codigo: '15176', nombre: 'Chiquinquirá' },
      { codigo: '15491', nombre: 'Paipa' },
      { codigo: '15690', nombre: 'Santa Rosa de Viterbo' },
      { codigo: '15238', nombre: 'Duitama' },
    ],
  },
  {
    codigo: '17',
    nombre: 'Caldas',
    municipios: [
      { codigo: '17001', nombre: 'Manizales' },
      { codigo: '17380', nombre: 'La Dorada' },
      { codigo: '17174', nombre: 'Chinchiná' },
      { codigo: '17524', nombre: 'Palestina' },
      { codigo: '17433', nombre: 'Manzanares' },
      { codigo: '17442', nombre: 'Marmato' },
      { codigo: '17867', nombre: 'Viterbo' },
    ],
  },
  {
    codigo: '18',
    nombre: 'Caquetá',
    municipios: [
      { codigo: '18001', nombre: 'Florencia' },
      { codigo: '18094', nombre: 'Belén de los Andaquíes' },
      { codigo: '18460', nombre: 'Montañita' },
      { codigo: '18479', nombre: 'Morelia' },
      { codigo: '18756', nombre: 'San Vicente del Caguán' },
    ],
  },
  {
    codigo: '19',
    nombre: 'Cauca',
    municipios: [
      { codigo: '19001', nombre: 'Popayán' },
      { codigo: '19698', nombre: 'Santander de Quilichao' },
      { codigo: '19142', nombre: 'Caloto' },
      { codigo: '19460', nombre: 'Miranda' },
      { codigo: '19573', nombre: 'Puerto Tejada' },
      { codigo: '19532', nombre: 'Patía' },
    ],
  },
  {
    codigo: '20',
    nombre: 'Cesar',
    municipios: [
      { codigo: '20001', nombre: 'Valledupar' },
      { codigo: '20400', nombre: 'La Jagua de Ibirico' },
      { codigo: '20443', nombre: 'Manaure' },
      { codigo: '20621', nombre: 'San Alberto' },
      { codigo: '20710', nombre: 'Tamalameque' },
    ],
  },
  {
    codigo: '23',
    nombre: 'Córdoba',
    municipios: [
      { codigo: '23001', nombre: 'Montería' },
      { codigo: '23189', nombre: 'Cereté' },
      { codigo: '23162', nombre: 'Caucasia' },
      { codigo: '23466', nombre: 'Montelíbano' },
      { codigo: '23417', nombre: 'Lorica' },
      { codigo: '23555', nombre: 'Planeta Rica' },
      { codigo: '23672', nombre: 'Sahagún' },
    ],
  },
  {
    codigo: '25',
    nombre: 'Cundinamarca',
    municipios: [
      { codigo: '25754', nombre: 'Soacha' },
      { codigo: '25175', nombre: 'Chía' },
      { codigo: '25430', nombre: 'Mosquera' },
      { codigo: '25473', nombre: 'Facatativá' },
      { codigo: '25899', nombre: 'Zipaquirá' },
      { codigo: '25658', nombre: 'Sabana de Bogotá (Funza)' },
      { codigo: '25307', nombre: 'Girardot' },
      { codigo: '25369', nombre: 'La Mesa' },
      { codigo: '25513', nombre: 'Chiquinquirá (Cundinamarca)' },
      { codigo: '25290', nombre: 'Fusagasugá' },
    ],
  },
  {
    codigo: '27',
    nombre: 'Chocó',
    municipios: [
      { codigo: '27001', nombre: 'Quibdó' },
      { codigo: '27361', nombre: 'Istmina' },
      { codigo: '27413', nombre: 'Lloró' },
      { codigo: '27086', nombre: 'Bojayá' },
    ],
  },
  {
    codigo: '41',
    nombre: 'Huila',
    municipios: [
      { codigo: '41001', nombre: 'Neiva' },
      { codigo: '41006', nombre: 'Acevedo' },
      { codigo: '41132', nombre: 'Campo Alegre' },
      { codigo: '41206', nombre: 'Garzón' },
      { codigo: '41791', nombre: 'Pitalito' },
      { codigo: '41524', nombre: 'Palermo' },
      { codigo: '41615', nombre: 'Rivera' },
    ],
  },
  {
    codigo: '44',
    nombre: 'La Guajira',
    municipios: [
      { codigo: '44001', nombre: 'Riohacha' },
      { codigo: '44430', nombre: 'Maicao' },
      { codigo: '44035', nombre: 'Albania' },
      { codigo: '44420', nombre: 'Manaure' },
      { codigo: '44847', nombre: 'Uribia' },
      { codigo: '44560', nombre: 'San Juan del Cesar' },
    ],
  },
  {
    codigo: '47',
    nombre: 'Magdalena',
    municipios: [
      { codigo: '47001', nombre: 'Santa Marta' },
      { codigo: '47189', nombre: 'Ciénaga' },
      { codigo: '47570', nombre: 'Plato' },
      { codigo: '47660', nombre: 'Santa Bárbara de Pinto' },
      { codigo: '47551', nombre: 'Pivijay' },
      { codigo: '47675', nombre: 'Santa Ana' },
    ],
  },
  {
    codigo: '50',
    nombre: 'Meta',
    municipios: [
      { codigo: '50001', nombre: 'Villavicencio' },
      { codigo: '50006', nombre: 'Acacías' },
      { codigo: '50124', nombre: 'Castilla la Nueva' },
      { codigo: '50313', nombre: 'Granada' },
      { codigo: '50325', nombre: 'Guamal' },
      { codigo: '50400', nombre: 'Lejanías' },
      { codigo: '50683', nombre: 'San Martín' },
    ],
  },
  {
    codigo: '52',
    nombre: 'Nariño',
    municipios: [
      { codigo: '52001', nombre: 'Pasto' },
      { codigo: '52356', nombre: 'Ipiales' },
      { codigo: '52110', nombre: 'Buesaco' },
      { codigo: '52835', nombre: 'Tumaco' },
      { codigo: '52520', nombre: 'Puerres' },
      { codigo: '52540', nombre: 'Samaniego' },
    ],
  },
  {
    codigo: '54',
    nombre: 'Norte de Santander',
    municipios: [
      { codigo: '54001', nombre: 'Cúcuta' },
      { codigo: '54518', nombre: 'Pamplona' },
      { codigo: '54174', nombre: 'Chinácota' },
      { codigo: '54206', nombre: 'Convención' },
      { codigo: '54344', nombre: 'Herrán' },
      { codigo: '54720', nombre: 'Tibú' },
      { codigo: '54871', nombre: 'Villa del Rosario' },
    ],
  },
  {
    codigo: '63',
    nombre: 'Quindío',
    municipios: [
      { codigo: '63001', nombre: 'Armenia' },
      { codigo: '63130', nombre: 'Calarcá' },
      { codigo: '63190', nombre: 'Circasia' },
      { codigo: '63212', nombre: 'Córdoba' },
      { codigo: '63401', nombre: 'La Tebaida' },
      { codigo: '63548', nombre: 'Quimbaya' },
    ],
  },
  {
    codigo: '66',
    nombre: 'Risaralda',
    municipios: [
      { codigo: '66001', nombre: 'Pereira' },
      { codigo: '66045', nombre: 'Apía' },
      { codigo: '66075', nombre: 'Balboa' },
      { codigo: '66170', nombre: 'Dosquebradas' },
      { codigo: '66318', nombre: 'Guática' },
      { codigo: '66400', nombre: 'La Celia' },
      { codigo: '66440', nombre: 'La Virginia' },
      { codigo: '66456', nombre: 'Marsella' },
      { codigo: '66572', nombre: 'Santa Rosa de Cabal' },
    ],
  },
  {
    codigo: '68',
    nombre: 'Santander',
    municipios: [
      { codigo: '68001', nombre: 'Bucaramanga' },
      { codigo: '68081', nombre: 'Barrancabermeja' },
      { codigo: '68276', nombre: 'Floridablanca' },
      { codigo: '68307', nombre: 'Girón' },
      { codigo: '68547', nombre: 'Piedecuesta' },
      { codigo: '68615', nombre: 'Puente Nacional' },
      { codigo: '68655', nombre: 'San Gil' },
      { codigo: '68679', nombre: 'Barbosa' },
      { codigo: '68720', nombre: 'Socorro' },
      { codigo: '68855', nombre: 'Vélez' },
    ],
  },
  {
    codigo: '70',
    nombre: 'Sucre',
    municipios: [
      { codigo: '70001', nombre: 'Sincelejo' },
      { codigo: '70215', nombre: 'Corozal' },
      { codigo: '70110', nombre: 'Coveñas' },
      { codigo: '70400', nombre: 'La Unión' },
      { codigo: '70508', nombre: 'Ovejas' },
      { codigo: '70702', nombre: 'San Marcos' },
      { codigo: '70771', nombre: 'Tolú' },
    ],
  },
  {
    codigo: '73',
    nombre: 'Tolima',
    municipios: [
      { codigo: '73001', nombre: 'Ibagué' },
      { codigo: '73024', nombre: 'Alpujarra' },
      { codigo: '73148', nombre: 'Carmen de Apicalá' },
      { codigo: '73168', nombre: 'Chaparral' },
      { codigo: '73349', nombre: 'Honda' },
      { codigo: '73408', nombre: 'Lérida' },
      { codigo: '73411', nombre: 'Líbano' },
      { codigo: '73443', nombre: 'Mariquita' },
      { codigo: '73449', nombre: 'Melgar' },
      { codigo: '73624', nombre: 'Purificación' },
      { codigo: '73854', nombre: 'Villahermosa' },
      { codigo: '73861', nombre: 'Villarrica' },
    ],
  },
  {
    codigo: '76',
    nombre: 'Valle del Cauca',
    municipios: [
      { codigo: '76001', nombre: 'Cali' },
      { codigo: '76892', nombre: 'Yumbo' },
      { codigo: '76520', nombre: 'Palmira' },
      { codigo: '76111', nombre: 'Guadalajara de Buga' },
      { codigo: '76823', nombre: 'Tuluá' },
      { codigo: '76109', nombre: 'Buenaventura' },
      { codigo: '76147', nombre: 'Cartago' },
      { codigo: '76364', nombre: 'Jamundí' },
      { codigo: '76306', nombre: 'Ginebra' },
      { codigo: '76736', nombre: 'Sevilla' },
      { codigo: '76670', nombre: 'San Pedro' },
      { codigo: '76400', nombre: 'Florida' },
      { codigo: '76563', nombre: 'Pradera' },
    ],
  },
  {
    codigo: '81',
    nombre: 'Arauca',
    municipios: [
      { codigo: '81001', nombre: 'Arauca' },
      { codigo: '81065', nombre: 'Arauquita' },
      { codigo: '81220', nombre: 'Cravo Norte' },
      { codigo: '81300', nombre: 'Fortul' },
      { codigo: '81591', nombre: 'Puerto Rondón' },
      { codigo: '81736', nombre: 'Saravena' },
      { codigo: '81794', nombre: 'Tame' },
    ],
  },
  {
    codigo: '85',
    nombre: 'Casanare',
    municipios: [
      { codigo: '85001', nombre: 'Yopal' },
      { codigo: '85010', nombre: 'Aguazul' },
      { codigo: '85015', nombre: 'Chámeza' },
      { codigo: '85125', nombre: 'Hato Corozal' },
      { codigo: '85136', nombre: 'La Salina' },
      { codigo: '85139', nombre: 'Maní' },
      { codigo: '85162', nombre: 'Monterrey' },
      { codigo: '85225', nombre: 'Nunchía' },
      { codigo: '85400', nombre: 'Paz de Ariporo' },
      { codigo: '85410', nombre: 'Pore' },
      { codigo: '85430', nombre: 'Recetor' },
      { codigo: '85440', nombre: 'Sabanalarga' },
      { codigo: '85507', nombre: 'San Luis de Palenque' },
      { codigo: '85325', nombre: 'Tauramena' },
      { codigo: '85400', nombre: 'Trinidad' },
      { codigo: '85430', nombre: 'Villanueva' },
    ],
  },
  {
    codigo: '86',
    nombre: 'Putumayo',
    municipios: [
      { codigo: '86001', nombre: 'Mocoa' },
      { codigo: '86320', nombre: 'La Hormiga (Valle del Guamuez)' },
      { codigo: '86569', nombre: 'Puerto Asís' },
      { codigo: '86573', nombre: 'Puerto Caicedo' },
      { codigo: '86749', nombre: 'San Francisco' },
      { codigo: '86755', nombre: 'San Miguel' },
      { codigo: '86757', nombre: 'Santiago' },
      { codigo: '86865', nombre: 'Villagarzón' },
    ],
  },
  {
    codigo: '88',
    nombre: 'San Andrés y Providencia',
    municipios: [
      { codigo: '88001', nombre: 'San Andrés' },
      { codigo: '88564', nombre: 'Providencia' },
    ],
  },
];

/**
 * Obtiene los municipios de un departamento por su código DANE
 */
export function getMunicipiosByDepto(codigoDepto: string): Municipio[] {
  const depto = DEPARTAMENTOS.find(d => d.codigo === codigoDepto);
  return depto?.municipios ?? [];
}

/**
 * Obtiene el nombre de un municipio por su código DANE de 5 dígitos
 */
export function getNombreMunicipio(codigoMunicipio: string): string {
  for (const depto of DEPARTAMENTOS) {
    const mun = depto.municipios.find(m => m.codigo === codigoMunicipio);
    if (mun) return mun.nombre;
  }
  return codigoMunicipio;
}

/**
 * Obtiene el nombre de un departamento por su código DANE de 2 dígitos
 */
export function getNombreDepto(codigoDepto: string): string {
  return DEPARTAMENTOS.find(d => d.codigo === codigoDepto)?.nombre ?? codigoDepto;
}

/**
 * Obtiene el código de departamento (2 dígitos) a partir de un código municipio (5 dígitos)
 */
export function getDeptoFromMunicipio(codigoMunicipio: string): string {
  return codigoMunicipio.slice(0, 2);
}

export interface MunicipioOption {
  /** Código DANE 5 dígitos */
  codigo: string;
  /** Nombre del municipio */
  nombre: string;
  /** Nombre del departamento */
  depto: string;
  /** Label compuesto para mostrar, ej: "Pereira, Risaralda" */
  label: string;
}

/**
 * Retorna todos los municipios como lista plana con su departamento incluido.
 * Útil para Autocomplete de búsqueda libre estilo Google Maps.
 */
export function getAllMunicipios(): MunicipioOption[] {
  return DEPARTAMENTOS.flatMap((depto) =>
    depto.municipios.map((mun) => ({
      codigo: mun.codigo,
      nombre: mun.nombre,
      depto: depto.nombre,
      label: `${mun.nombre}, ${depto.nombre}`,
    }))
  );
}
