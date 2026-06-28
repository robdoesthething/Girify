export interface Landmark {
  name: string;
  pos: [number, number];
  icon: string;
}

export const LANDMARKS: Landmark[] = [
  // Tourist Sites
  { name: 'Sagrada Familia', pos: [41.4036, 2.1744], icon: '⛪' },
  { name: 'Torre Glòries', pos: [41.4036, 2.1894], icon: '🥒' },
  { name: 'Tibidabo', pos: [41.4218, 2.1186], icon: '🎡' },
  { name: 'Park Güell', pos: [41.4145, 2.1527], icon: '🦎' },
  { name: 'Camp Nou', pos: [41.3809, 2.1228], icon: '⚽' },
  { name: 'MNAC', pos: [41.3688, 2.1534], icon: '🏛️' },
  { name: 'W Hotel', pos: [41.3684, 2.191], icon: '⛵' },
  { name: 'Casa Batlló', pos: [41.3916, 2.1649], icon: '🎭' },
  { name: 'La Pedrera', pos: [41.3954, 2.1619], icon: '🗿' },
  { name: 'Arc de Triomf', pos: [41.3911, 2.1806], icon: '🧱' },
  { name: 'Catedral', pos: [41.384, 2.1762], icon: '⛪' },
  { name: 'Monument a Colom', pos: [41.3758, 2.1778], icon: '👉' },
  { name: 'Boqueria', pos: [41.3817, 2.1716], icon: '🍇' },
  { name: 'Palau de la Música', pos: [41.3875, 2.1753], icon: '🎻' },
  { name: 'Santa Maria del Mar', pos: [41.3837, 2.182], icon: '⛪' },
  { name: 'Poble Espanyol', pos: [41.3675, 2.1469], icon: '🏘️' },

  // Parks
  { name: 'Parc de la Ciutadella', pos: [41.3881, 2.1873], icon: '🌳' },
  { name: "Parc del Laberint d'Horta", pos: [41.4397, 2.1465], icon: '🌳' },
  { name: 'Parc de Montjuïc', pos: [41.3636, 2.1578], icon: '🌳' },
  { name: 'Parc del Guinardó', pos: [41.4187, 2.1642], icon: '🌳' },
  { name: 'Jardins de Mossèn Costa i Llobera', pos: [41.3661, 2.1659], icon: '🌵' },
  { name: 'Parc de Diagonal Mar', pos: [41.4103, 2.2168], icon: '🌳' },
  { name: "Parc de l'Espanya Industrial", pos: [41.3768, 2.1378], icon: '🌳' },
  { name: 'Parc de Joan Miró', pos: [41.3773, 2.1461], icon: '🌳' },

  // Museums
  { name: 'Museu Picasso', pos: [41.3851, 2.1811], icon: '🖼️' },
  { name: 'MACBA', pos: [41.3833, 2.1667], icon: '🖼️' },
  { name: 'Museu Marítim', pos: [41.3755, 2.1754], icon: '⚓' },
  { name: 'CosmoCaixa', pos: [41.413, 2.1317], icon: '🔬' },
  { name: 'Fundació Joan Miró', pos: [41.3685, 2.16], icon: '🖼️' },
  { name: 'CaixaForum', pos: [41.371, 2.1492], icon: '🖼️' },
  { name: "Museu d'Història de Barcelona", pos: [41.384, 2.1773], icon: '🏺' },

  // Mountains & Viewpoints
  { name: 'Montjuïc', pos: [41.3636, 2.1578], icon: '⛰️' },
  { name: 'Bunkers del Carmel', pos: [41.4186, 2.1579], icon: '🏔️' },
  { name: 'Turó de la Rovira', pos: [41.4189, 2.158], icon: '👀' },
  { name: 'Collserola Tower', pos: [41.4175, 2.115], icon: '📡' },

  // Shopping Malls
  { name: 'Heron City (Som Multiespai)', pos: [41.435, 2.1818], icon: '🛍️' },
  { name: 'Diagonal Mar', pos: [41.412, 2.2163], icon: '🛍️' },
  { name: 'Westfield Glòries', pos: [41.4042, 2.1913], icon: '🛍️' },
  { name: "L'Illa Diagonal", pos: [41.3892, 2.1384], icon: '🛍️' },
  { name: 'Las Arenas', pos: [41.3758, 2.1492], icon: '🛍️' },
  { name: 'Maremagnum', pos: [41.3753, 2.1828], icon: '🛍️' },
  { name: 'Gran Via 2', pos: [41.361, 2.1287], icon: '🛍️' },
  { name: 'Splau', pos: [41.3551, 2.0722], icon: '🛍️' },

  // Beaches
  { name: 'Platja de Sant Sebastià', pos: [41.3712, 2.1895], icon: '🏖️' },
  { name: 'Platja de la Barceloneta', pos: [41.3784, 2.1925], icon: '🏖️' },
  { name: 'Platja de Somorrostro', pos: [41.3834, 2.1963], icon: '🏖️' },
  { name: 'Platja de la Nova Icària', pos: [41.3907, 2.2035], icon: '🏖️' },
  { name: 'Platja del Bogatell', pos: [41.3948, 2.2078], icon: '🏖️' },
  { name: 'Platja de la Mar Bella', pos: [41.3995, 2.2132], icon: '🏖️' },
  { name: 'Platja de la Nova Mar Bella', pos: [41.4035, 2.2173], icon: '🏖️' },
  { name: 'Platja de Llevant', pos: [41.4072, 2.2215], icon: '🏖️' },

  // Hospitals
  { name: 'Hospital Clínic', pos: [41.3896, 2.1539], icon: '🏥' },
  { name: 'Hospital Sant Pau', pos: [41.4116, 2.1749], icon: '🏥' },
  { name: "Vall d'Hebron", pos: [41.4277, 2.1444], icon: '🏥' },
  { name: 'Hospital del Mar', pos: [41.3845, 2.1936], icon: '🏥' },

  // Sarrià-Sant Gervasi District
  { name: 'Monestir de Pedralbes', pos: [41.3957, 2.1113], icon: '⛪' },
  { name: "Parc de l'Oreneta", pos: [41.4003, 2.1147], icon: '🌳' },
  { name: 'Parc de Cervantes', pos: [41.3875, 2.1123], icon: '🌹' },
  { name: 'Jardins de la Vil·la Amèlia', pos: [41.3965, 2.1318], icon: '🌳' },
  { name: 'Jardins de la Tamarita', pos: [41.4041, 2.1362], icon: '🌳' },
  { name: 'Sarrià', pos: [41.4003, 2.1213], icon: '🏘️' },
  { name: 'Plaça de Sarrià', pos: [41.4005, 2.1218], icon: '⛲' },

  // Sant Andreu District
  { name: 'Fabra i Coats', pos: [41.4367, 2.1899], icon: '🏭' },
  { name: 'Parc de la Trinitat', pos: [41.4478, 2.1856], icon: '🌳' },
  { name: 'Mercat de Sant Andreu', pos: [41.4355, 2.1903], icon: '🛒' },
  { name: 'Plaça del Comerç', pos: [41.4339, 2.1902], icon: '⛲' },
  { name: 'Sant Andreu Arenal', pos: [41.4312, 2.1888], icon: '🏟️' },
  { name: 'Parc de la Pegaso', pos: [41.4243, 2.1924], icon: '🌳' },

  // Nou Barris District
  { name: 'Parc Central de Nou Barris', pos: [41.4418, 2.1732], icon: '🌳' },
  { name: 'Parc del Turó de la Peira', pos: [41.4344, 2.1611], icon: '🌳' },
  { name: 'Mundet', pos: [41.4395, 2.1518], icon: '🏫' },
  { name: 'Roquetes', pos: [41.4486, 2.1651], icon: '🏘️' },
  { name: 'Torre Baró', pos: [41.4568, 2.1785], icon: '🏔️' },
  { name: 'Ciutat Meridiana', pos: [41.4613, 2.1792], icon: '🏘️' },
  { name: 'Parc de les Aigües', pos: [41.4391, 2.1653], icon: '💧' },
  { name: 'Can Dragó', pos: [41.435, 2.1818], icon: '🏟️' },
  { name: 'Via Júlia', pos: [41.4432, 2.1773], icon: '🛣️' },
  { name: 'Mercat de la Guineueta', pos: [41.4419, 2.1707], icon: '🛒' },
  { name: 'Plaça de Sóller', pos: [41.4467, 2.1751], icon: '⛲' },

  // Horta neighborhood
  { name: "Plaça d'Eivissa", pos: [41.4304, 2.1665], icon: '⛲' },
  { name: "Mercat d'Horta", pos: [41.4297, 2.1602], icon: '🛒' },
  { name: "Velòdrom d'Horta", pos: [41.4337, 2.1549], icon: '🚴' },

  // Sarrià-Sant Gervasi upper areas
  { name: 'La Bonanova', pos: [41.4068, 2.1275], icon: '⛪' },
  { name: 'Turó Park', pos: [41.3963, 2.1374], icon: '🌳' },
  { name: 'Palau Reial de Pedralbes', pos: [41.3878, 2.1148], icon: '🏰' },
];
