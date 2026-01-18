// Barcelona Curiosities Data
// Source: User Provided JSON (25 Valid Entries)

import { getTodaySeed, seededRandom } from '../utils/dailyChallenge';

export type CuriosityType =
  | 'Legend'
  | 'History'
  | 'Architecture'
  | 'Curiosity'
  | 'Art'
  | 'Culture'
  | 'Food';

export interface Curiosity {
  id: number;
  location: string;
  district: string;
  type: CuriosityType;
  textEn: string;
  textEs: string;
  textCa: string;
  image: string;
}

export interface CuriosityResult {
  title: string;
  fact: string;
  image: string;
  location: string;
  matchedStreet: string | null;
}

interface QuizStreet {
  name: string;
  [key: string]: unknown;
}

const CURIOSITIES_DATA: Curiosity[] = [
  {
    id: 1,
    location: 'Carrer del Bisbe',
    district: 'Ciutat Vella',
    type: 'Legend',
    textEn:
      'The bridge connecting the Generalitat and the Casa dels Canonges was built in 1928, not during the Middle Ages. Look for the skull with a dagger through it underneath; legend says if the dagger is removed, Barcelona will fall.',
    textEs:
      'El puente que conecta la Generalitat y la Casa dels Canonges fue construido en 1928, no en la Edad Media. Busca la calavera atraversada por una daga debajo; la leyenda dice que si se retira la daga, Barcelona caerá.',
    textCa:
      "El pont que connecta la Generalitat i la Casa dels Canonges va ser construït el 1928, no a l'Edat Mitjana. Busca la calavera travessada per una daga a sota; la llegenda diu que si es retira la daga, Barcelona caurà.",
    image:
      'https://images.unsplash.com/photo-1539186607619-df476afe3ff1?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    location: 'Plaça de Sant Felip Neri',
    district: 'Ciutat Vella',
    type: 'History',
    textEn:
      'The pockmarks on the church walls were long rumored to be from execution squads during the Civil War. In reality, they are the scars of a 1938 fascist bombing that killed 42 people, mostly children hiding in the basement.',
    textEs:
      'Se rumoreaba que las marcas en las paredes de la iglesia eran de fusilamientos durante la Guerra Civil. En realidad, son cicatrices de un bombardeo fascista de 1938 que mató a 42 personas, la mayoría niños escondidos en el sótano.',
    textCa:
      "Es deia que les marques a les parets de l'església eren d'afusellaments durant la Guerra Civil. En realitat, són cicatrius d'un bombardeig feixista de 1938 que va matar 42 persones, la majoria nens amagats al soterrani.",
    image:
      'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    location: 'Sagrada Família',
    district: 'Eixample',
    type: 'Architecture',
    textEn:
      'The Passion Façade features a 4x4 magic square where every row, column, and diagonal adds up to 33. This number represents the age of Jesus Christ at the time of his death.',
    textEs:
      'La Fachada de la Pasión presenta un cuadrado mágico de 4x4 donde cada fila, columna y diagonal suma 33. Este número representa la edad de Jesucristo en el momento de su muerte.',
    textCa:
      "La Façana de la Passió presenta un quadrat màgic de 4x4 on cada fila, columna i diagonal suma 33. Aquest número representa l'edat de Jesucrist al moment de la seva mort.",
    image:
      'https://images.unsplash.com/photo-1583778175782-d1d494957d77?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4,
    location: 'Font de Canaletes',
    district: 'Ciutat Vella',
    type: 'Legend',
    textEn:
      'Located at the top of La Rambla, this 19th-century fountain is the gathering point for FC Barcelona celebrations. Legend promises that anyone who drinks its water will eventually return to the city.',
    textEs:
      'Situada al inicio de La Rambla, esta fuente del siglo XIX es el punto de encuentro para las celebraciones del FC Barcelona. La leyenda promete que quien beba su agua volverá a la ciudad.',
    textCa:
      'Situada al capdamunt de La Rambla, aquesta font del segle XIX és el punt de trobada per a les celebracions del FC Barcelona. La llegenda promet que qui begui la seva aigua tornarà a la ciutat.',
    image:
      'https://images.unsplash.com/photo-1512411082531-d859f931d87f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 5,
    location: 'Columbus Monument',
    district: 'Ciutat Vella',
    type: 'Curiosity',
    textEn:
      'The statue of Christopher Columbus points toward the sea, but not toward the Americas. He is actually pointing southeast, roughly in the direction of his supposed birthplace, Genoa.',
    textEs:
      'La estatua de Cristóbal Colón señala hacia el mar, pero no hacia las Américas. En realidad señala al sureste, más o menos en dirección a su supuesto lugar de nacimiento, Génova.',
    textCa:
      "L'estàtua de Cristòfor Colom assenyala cap al mar, però no cap a les Amèriques. En realitat assenyala al sud-est, més o menys en direcció al seu suposat lloc de naixement, Gènova.",
    image:
      'https://images.unsplash.com/photo-1520112460341-35639f727402?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 6,
    location: "Carrer d'Avinyó",
    district: 'Ciutat Vella',
    type: 'Art',
    textEn:
      "This street once housed a famous brothel visited by a young Pablo Picasso. The women working there inspired his groundbreaking cubist masterpiece, 'Les Demoiselles d'Avignon'.",
    textEs:
      "Esta calle albergaba un famoso burdel visitado por un joven Pablo Picasso. Las mujeres que trabajaban allí inspiraron su obra maestra cubista, 'Les Demoiselles d'Avignon'.",
    textCa:
      "Aquest carrer albergava un famós bordell visitat per un jove Pablo Picasso. Les dones que hi treballaven van inspirar la seva obra mestra cubista, 'Les Demoiselles d'Avignon'.",
    image:
      'https://images.unsplash.com/photo-1505322022379-7c3353ee6291?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 7,
    location: 'Temple of Augustus',
    district: 'Ciutat Vella',
    type: 'History',
    textEn:
      'Inside the courtyard of the Centre Excursionista de Catalunya, four massive Roman columns stand hidden. They are over 2,000 years old and were part of the forum of the original Roman colony, Barcino.',
    textEs:
      'Dentro del patio del Centre Excursionista de Catalunya, se esconden cuatro enormes columnas romanas. Tienen más de 2.000 años y formaban parte del foro de la colonia romana original, Barcino.',
    textCa:
      "Dins del pati del Centre Excursionista de Catalunya, s'amaguen quatre enormes columnes romanes. Tenen més de 2.000 anys i formaven part del fòrum de la colònia romana original, Barcino.",
    image:
      'https://images.unsplash.com/photo-1514813482567-2858e6c00ee1?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 8,
    location: 'Carrer de Montcada',
    district: 'Ciutat Vella',
    type: 'Culture',
    textEn:
      "This was the most prestigious street in medieval Barcelona, lined with Gothic palaces. Today, five of these interconnected palaces house the Picasso Museum, the city's most visited art gallery.",
    textEs:
      'Esta fue la calle más prestigiosa de la Barcelona medieval, llena de palacios góticos. Hoy, cinco de estos palacios interconectados albergan el Museo Picasso, la galería de arte más visitada de la ciudad.',
    textCa:
      "Aquest va ser el carrer més prestigiós de la Barcelona medieval, ple de palaus gòtics. Avui, cinc d'aquests palaus interconnectats alberguen el Museu Picasso, la galeria d'art més visitada de la ciutat.",
    image:
      'https://images.unsplash.com/photo-1503917988258-f19c08679093?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 9,
    location: 'Santa Maria del Mar',
    district: 'Ciutat Vella',
    type: 'History',
    textEn:
      "Known as the 'Cathedral of the Sea,' it was built entirely by the local port workers (bastaixos) who carried heavy stones from Montjuïc on their backs. Look at the main doors to see carvings honoring these workers.",
    textEs:
      "Conocida como la 'Catedral del Mar', fue construida enteramente por los trabajadores del puerto (bastaixos) que cargaban pesadas piedras desde Montjuïc en sus espaldas. Mira las puertas principales para ver tallas honrando a estos trabajadores.",
    textCa:
      "Coneguda com la 'Catedral del Mar', va ser construïda enterament per els treballadors del port (bastaixos) que carregaven pesades pedres des de Montjuïc a les seves esquenes. Mira les portes principals per veure talles honorant aquests treballadors.",
    image:
      'https://images.unsplash.com/photo-1533602161203-d64e9a11a2f6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 10,
    location: 'Casa Batlló',
    district: 'Eixample',
    type: 'Architecture',
    textEn:
      "The roof of this Gaudí masterpiece represents the back of the dragon slain by Saint George. The balconies are designed to look like the skulls of the dragon's victims, while the pillars resemble their bones.",
    textEs:
      'El techo de esta obra maestra de Gaudí representa la espalda del dragón asesinado por San Jorge. Los balcones están diseñados para parecer calaveras de las víctimas del dragón, mientras que los pilares parecen sus huesos.',
    textCa:
      "El sostre d'aquesta obra mestra de Gaudí representa l'esquena del drac assassinat per Sant Jordi. Els balcons estan dissenyats per semblar calaveres de les víctimes del drac, mentre que els pilars semblen els seus ossos.",
    image:
      'https://images.unsplash.com/photo-1563297050-48413b91c828?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 11,
    location: 'Passeig de Gràcia',
    district: 'Eixample',
    type: 'Art',
    textEn:
      'The hexagonal paving stones on this street were designed by Antoni Gaudí himself. They feature marine motifs like starfish and snails, originally intended for the floor of Casa Batlló.',
    textEs:
      'Las baldosas hexagonales de esta calle fueron diseñadas por el propio Antoni Gaudí. Presentan motivos marinos como estrellas de mar y caracoles, originalmente destinados al suelo de la Casa Batlló.',
    textCa:
      "Les rajoles hexagonals d'aquest carrer van ser dissenyades pel mateix Antoni Gaudí. Presenten motius marins com estrelles de mar i cargols, originalment destinats al terra de la Casa Batlló.",
    image:
      'https://images.unsplash.com/photo-1549144511-f099e773c147?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 12,
    location: 'Plaça de Catalunya',
    district: 'Eixample',
    type: 'History',
    textEn:
      "This massive square is the heart of the city but didn't exist until 1927. Before the 1888 Expo, it was an empty space where the city walls had been torn down to connect the old city with the new Eixample.",
    textEs:
      'Esta enorme plaza es el corazón de la ciudad pero no existió hasta 1927. Antes de la Expo de 1888, era un espacio vacío donde se habían derribado las murallas para conectar la ciudad vieja con el nuevo Eixample.',
    textCa:
      "Aquesta enorme plaça és el cor de la ciutat però no va existir fins al 1927. Abans de l'Expo de 1888, era un espai buit on s'havien enderrocat les muralles per connectar la ciutat vella amb el nou Eixample.",
    image:
      'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 13,
    location: 'La Pedrera (Casa Milà)',
    district: 'Eixample',
    type: 'Architecture',
    textEn:
      "Locals initially hated Gaudí's building, calling it 'La Pedrera' (The Quarry) because of its rough stone appearance. Its wavy stone structure was so heavy that it required innovative internal steel supports.",
    textEs:
      "Los locales odiaban inicialmente el edificio de Gaudí, llamándolo 'La Pedrera' por su apariencia de piedra rugosa. Su estructura de piedra ondulada era tan pesada que requirió innovadores soportes internos de acero.",
    textCa:
      "Els locals odiaven inicialment l'edifici de Gaudí, anomenant-lo 'La Pedrera' per la seva aparença de pedra rugosa. La seva estructura de pedra ondulada era tan pesada que va requerir innovadors suports interns d'acer.",
    image:
      'https://images.unsplash.com/photo-1561501900-3701fa6a0864?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 14,
    location: 'Carrer dels Mirallers',
    district: 'Ciutat Vella',
    type: 'Curiosity',
    textEn:
      "Look at the corner of the building for a 'Carassa' (a stone face). In medieval times, these faces signaled to illiterate sailors where the local brothels were located.",
    textEs:
      "Busca en la esquina del edificio una 'Carassa' (una cara de piedra). En la época medieval, estas caras señalaban a los marineros analfabetos dónde estaban los burdeles locales.",
    textCa:
      "Busca a la cantonada de l'edifici una 'Carassa' (una cara de pedra). A l'època medieval, aquestes cares assenyalaven als mariners analfabets on eren els bordells locals.",
    image:
      'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 15,
    location: 'Plaça de George Orwell',
    district: 'Ciutat Vella',
    type: 'Curiosity',
    textEn:
      "Known to locals as 'Trippy Square,' it was named after the author of '1984.' Ironically, it was the first place in Barcelona to have permanent police surveillance cameras installed.",
    textEs:
      "Conocida por los locales como 'Plaza Trippy', lleva el nombre del autor de '1984'. Irónicamente, fue el primer lugar en Barcelona en tener cámaras de vigilancia policial permanentes instaladas.",
    textCa:
      "Coneguda pels locals com 'Plaça Trippy', porta el nom de l'autor de '1984'. Irònicament, va ser el primer lloc a Barcelona en tenir càmeres de vigilància policial permanents instal·lades.",
    image:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 16,
    location: 'Bunkers del Carmel',
    district: 'Horta-Guinardó',
    type: 'History',
    textEn:
      'These are not actually bunkers but anti-aircraft battery bases from the Civil War. After the war, the area became a shanty town (barraquisme) before being renovated for the public view.',
    textEs:
      'En realidad no son búnkeres, sino bases de baterías antiaéreas de la Guerra Civil. Después de la guerra, la zona se convirtió en un barrio de chabolas (barraquismo) antes de ser renovada para el público.',
    textCa:
      'En realitat no són búnquers, sinó bases de bateries antiaèries de la Guerra Civil. Després de la guerra, la zona es va convertir en un barri de barraques (barraquisme) abans de ser renovada per al públic.',
    image:
      'https://images.unsplash.com/photo-1527473350117-7cc87042d330?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 17,
    location: 'Arc de Triomf',
    district: 'Eixample',
    type: 'Architecture',
    textEn:
      "Unlike the Arc de Triomphe in Paris, which celebrates military victories, Barcelona's arch was built as the gateway to the 1888 Universal Exhibition and represents civil and economic progress.",
    textEs:
      'A diferencia del Arco de Triunfo de París, que celebra victorias militares, el arco de Barcelona se construyó como puerta de entrada a la Exposición Universal de 1888 y representa el progreso civil y económico.',
    textCa:
      "A diferència de l'Arc de Triomf de París, que celebra victòries militars, l'arc de Barcelona es va construir com a porta d'entrada a l'Exposició Universal de 1888 i representa el progrés civil i econòmic.",
    image:
      'https://images.unsplash.com/photo-1558642084-fd07fae5282e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 18,
    location: 'Mercat de Sant Josep de la Boqueria',
    district: 'Ciutat Vella',
    type: 'Food',
    textEn:
      "The market began as a traveling street market in 1217. Its iconic modernist metal roof wasn't built until 1914, turning it into the permanent culinary landmark it is today.",
    textEs:
      'El mercado comenzó como un mercado callejero ambulante en 1217. Su icónico techo de metal modernista no se construyó hasta 1914, convirtiéndolo en el hito culinario permanente que es hoy.',
    textCa:
      'El mercat va començar com un mercat de carrer ambulant el 1217. El seu icònic sostre de metall modernista no es va construir fins al 1914, convertint-lo en la fita culinària permanent que és avui.',
    image:
      'https://images.unsplash.com/photo-1541544186542-a63328e93344?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 19,
    location: 'Carrer de Petritxol',
    district: 'Ciutat Vella',
    type: 'Culture',
    textEn:
      "This was the first pedestrian-only street in Barcelona, converted in 1959. It is famous for its 'granges' serving thick hot chocolate and its ceramic plaques documenting the street's history.",
    textEs:
      "Esta fue la primera calle peatonal de Barcelona, convertida en 1959. Es famosa por sus 'granges' que sirven chocolate caliente espeso y sus placas de cerámica que documentan la historia de la calle.",
    textCa:
      "Aquest va ser el primer carrer de vianants de Barcelona, convertit el 1959. És famós per les seves 'granges' que serveixen xocolata desfeta espessa i les seves plaques de ceràmica que documenten la història del carrer.",
    image:
      'https://images.unsplash.com/photo-1503917988258-f19c08679093?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 20,
    location: 'Barcelona Cathedral',
    district: 'Ciutat Vella',
    type: 'Legend',
    textEn:
      "In the cathedral's cloister, you will find 13 white geese. They represent the age of Saint Eulalia, the city's co-patron saint, who was martyred by the Romans at 13.",
    textEs:
      'En el claustro de la catedral, encontrarás 13 ocas blancas. Representan la edad de Santa Eulalia, copatrona de la ciudad, que fue martirizada por los romanos a los 13 años.',
    textCa:
      "Al claustre de la catedral, trobaràs 13 oques blanques. Representen l'edat de Santa Eulàlia, copatrona de la ciutat, que va ser martiritzada pels romans als 13 anys.",
    image:
      'https://images.unsplash.com/photo-1550586678-f7225f03c44b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 21,
    location: "Casa de l'Ardiaca",
    district: 'Ciutat Vella',
    type: 'Art',
    textEn:
      'Look for the marble mailbox designed by Lluis Domènech i Montaner. The swallows represent the speed of justice, while the tortoise represents the reality of the slow legal system.',
    textEs:
      'Busca el buzón de mármol diseñado por Lluís Domènech i Montaner. Las golondrinas representan la velocidad de la justicia, mientras que la tortuga representa la realidad del lento sistema legal.',
    textCa:
      'Busca la bústia de marbre dissenyada per Lluís Domènech i Montaner. Les orenetes representen la velocitat de la justícia, mentre que la tortuga representa la realitat del lent sistema legal.',
    image:
      'https://images.unsplash.com/photo-1512411082531-d859f931d87f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 22,
    location: 'Park Güell',
    district: 'Gràcia',
    type: 'History',
    textEn:
      'Gaudí originally designed this as a private, high-end housing estate for 60 families. It was a commercial failure, with only two houses ever built, leading it to become a public park.',
    textEs:
      'Gaudí lo diseñó originalmente como una urbanización privada de lujo para 60 familias. Fue un fracaso comercial, con solo dos casas construidas, lo que llevó a que se convirtiera en un parque público.',
    textCa:
      'Gaudí el va dissenyar originalment com una urbanització privada de luxe per a 60 famílies. Va ser un fracàs comercial, amb només dues cases construïdes, la qual cosa va portar a que es convertís en un parc públic.',
    image:
      'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 23,
    location: 'Carrer de la Portaferrissa',
    district: 'Ciutat Vella',
    type: 'History',
    textEn:
      "Named 'Iron Gate' because a metal rod was kept here so farmers could measure their carts before entering the narrow city streets to avoid getting stuck.",
    textEs:
      "Llamada 'Puerta de Hierro' porque aquí se guardaba una vara de metal para que los agricultores pudieran medir sus carros antes de entrar en las estrechas calles de la ciudad para evitar atascarse.",
    textCa:
      "Anomenada 'Portaferrissa' perquè aquí es guardava una vara de metall perquè els pagesos poguessin mesurar els seus carros abans d'entrar als estrets carrers de la ciutat per evitar encallar-se.",
    image:
      'https://images.unsplash.com/photo-1549144511-f099e773c147?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 24,
    location: 'Carrer de les Mosques',
    district: 'Ciutat Vella',
    type: 'Curiosity',
    textEn:
      "This is one of the narrowest streets in Barcelona. Its name, 'Street of the Flies,' comes from the swarms that used to follow the waste from the nearby meat markets.",
    textEs:
      "Esta es una de las calles más estrechas de Barcelona. Su nombre, 'Calle de las Moscas', proviene de los enjambres que solían seguir los desechos de los mercados de carne cercanos.",
    textCa:
      "Aquest és un dels carrers més estrets de Barcelona. El seu nom, 'Carrer de les Mosques', prové dels eixams que solien seguir les deixalles dels merctas de carn propers.",
    image:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 25,
    location: 'Plaça Reial',
    district: 'Ciutat Vella',
    type: 'Art',
    textEn:
      "The lanterns with the winged helmets were Antoni Gaudí's first commission for the city after graduating. He was only 26 years old at the time.",
    textEs:
      'Las farolas con los cascos alados fueron el primer encargo de Antoni Gaudí para la ciudad después de graduarse. Solo tenía 26 años en ese momento.',
    textCa:
      "Els fanals amb els cascos alats van ser el primer encàrrec d'Antoni Gaudí per a la ciutat després de graduar-se. Només tenia 26 anys en aquell moment.",
    image:
      'https://images.unsplash.com/photo-1563297050-48413b91c828?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 26,
    location: 'Gran Via de les Corts Catalanes',
    district: 'Eixample',
    type: 'History',
    textEn:
      "Spanning 13.1 km, it is the longest street in Catalonia, stretching from L'Hospitalet to Sant Adrià de Besòs.",
    textEs:
      "Con 13,1 km, es la calle más larga de Cataluña, extendiéndose desde L'Hospitalet hasta Sant Adrià de Besòs.",
    textCa:
      "Amb 13,1 km, és el carrer més llarg de Catalunya, estenent-se des de L'Hospitalet fins a Sant Adrià de Besòs.",
    image:
      'https://upload.wikimedia.org/wikipedia/commons/e/e0/Gran_Via_de_les_Corts_Catalanes%2C_680_BCN_02.jpg',
  },
  {
    id: 27,
    location: 'Avinguda Diagonal',
    district: 'Eixample',
    type: 'Architecture',
    textEn:
      'Ildefons Cerdà designed this avenue to cut through the orthogonal grid, facilitating rapid transit across the city.',
    textEs:
      'Ildefons Cerdà diseñó esta avenida para cortar la cuadrícula ortogonal, facilitando el tránsito rápido por la ciudad.',
    textCa:
      'Ildefons Cerdà va dissenyar aquesta avinguda per tallar la quadrícula ortogonal, facilitant el trànsit ràpid per la ciutat.',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/a/a2/Barcelona_-_Avinguda_Diagonal_-_View_ENE_I.jpg',
  },
  {
    id: 28,
    location: 'Rambla del Poblenou',
    district: 'Sant Martí',
    type: 'Culture',
    textEn:
      'The heart of the Poblenou district, leading directly to the Bogatell beach. It retains a village-like atmosphere.',
    textEs:
      'El corazón del barrio del Poblenou, que conduce directamente a la playa del Bogatell. Conserva un ambiente de pueblo.',
    textCa:
      'El cor del barri del Poblenou, que condueix directament a la platja del Bogatell. Conserva un ambient de poble.',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/5/52/Rambla_del_Poblenou_%28Barcelona%29_October_2023.JPG',
  },
  {
    id: 29,
    location: 'Ronda de Dalt',
    district: 'Horta-Guinardó',
    type: 'History',
    textEn:
      'Built for the 1992 Olympics, this ring road drastically reduced traffic congestion in the city center.',
    textEs:
      'Construida para los Juegos Olímpicos de 1992, esta ronda redujo drásticamente la congestión del tráfico en el centro de la ciudad.',
    textCa:
      'Construïda per als Jocs Olímpics del 1992, aquesta ronda va reduir dràsticament la congestió del trànsit al centre de la ciutat.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Ronda_de_dalt_Barna.JPG',
  },
];

const GENERIC_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80', // Barcelona Street
  'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?auto=format&fit=crop&w=800&q=80', // Barcelona Architecture
  'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?auto=format&fit=crop&w=800&q=80', // Arc de Triomf
  'https://images.unsplash.com/photo-1579282240050-352db0a14c21?auto=format&fit=crop&w=800&q=80', // Parc Guell
  'https://images.unsplash.com/photo-1558642084-fd07fae5282e?auto=format&fit=crop&w=800&q=80', // Eixample
  'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80', // Gothic Quarter
];

function getRandomImage(): string {
  return GENERIC_IMAGES[Math.floor(Math.random() * GENERIC_IMAGES.length)];
}

/**
 * Clean street name for fuzzy matching
 */
const simplify = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(
      /^(carrer|avinguda|plaça|passeig|passatge|ronda|via|camí|parc|jardins|rambla)\s+(de\s+|del\s+|d'|els\s+)?/i,
      ''
    )
    .replace(/[^a-z0-9]/g, '');
};

/**
 * Get a curiosity based on the streets played in the quiz.
 */
export function getCuriosityByStreets(
  quizStreets: QuizStreet[],
  dateSeed?: number,
  language: string = 'en'
): CuriosityResult {
  const seed = dateSeed || getTodaySeed();

  const getLocalizedText = (item: Curiosity): string => {
    if (language === 'es') {
      return item.textEs || item.textEn;
    }
    if (language === 'ca') {
      return item.textCa || item.textEs || item.textEn;
    }
    return item.textEn;
  };

  if (!quizStreets || quizStreets.length === 0) {
    const index = Math.floor(seededRandom(seed) * CURIOSITIES_DATA.length);
    const random = CURIOSITIES_DATA[index];
    const imgIndex = Math.floor(seededRandom(seed + 1) * GENERIC_IMAGES.length);
    return {
      title: random.location,
      fact: getLocalizedText(random),
      image: random.image || GENERIC_IMAGES[imgIndex],
      location: random.location,
      matchedStreet: null,
    };
  }

  for (const street of quizStreets) {
    const simpleName = simplify(street.name);

    const match = CURIOSITIES_DATA.find(c => {
      const simpleLoc = simplify(c.location);
      return simpleName.includes(simpleLoc) || simpleLoc.includes(simpleName);
    });

    if (match) {
      return {
        title: match.location,
        fact: getLocalizedText(match),
        image: match.image || getRandomImage(),
        location: match.location,
        matchedStreet: street.name,
      };
    }
  }

  const index = Math.floor(seededRandom(seed + 2) * CURIOSITIES_DATA.length);
  const random = CURIOSITIES_DATA[index];
  const imgIndex = Math.floor(seededRandom(seed + 3) * GENERIC_IMAGES.length);

  return {
    title: random.location,
    fact: getLocalizedText(random),
    image: random.image || GENERIC_IMAGES[imgIndex],
    location: random.location,
    matchedStreet: null,
  };
}
