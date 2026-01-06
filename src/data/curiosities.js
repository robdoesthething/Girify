// Barcelona Curiosities Data
// Source: User Provided JSON (25 Valid Entries)

const CURIOSITIES_DATA = [
  {
    id: 1,
    location: 'Carrer del Bisbe',
    district: 'Ciutat Vella',
    type: 'Legend',
    text: 'The bridge connecting the Generalitat and the Casa dels Canonges was built in 1928, not during the Middle Ages. Look for the skull with a dagger through it underneath; legend says if the dagger is removed, Barcelona will fall.',
    image:
      'https://images.unsplash.com/photo-1539186607619-df476afe3ff1?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    location: 'Plaça de Sant Felip Neri',
    district: 'Ciutat Vella',
    type: 'History',
    text: 'The pockmarks on the church walls were long rumored to be from execution squads during the Civil War. In reality, they are the scars of a 1938 fascist bombing that killed 42 people, mostly children hiding in the basement.',
    image:
      'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    location: 'Sagrada Família',
    district: 'Eixample',
    type: 'Architecture',
    text: 'The Passion Façade features a 4x4 magic square where every row, column, and diagonal adds up to 33. This number represents the age of Jesus Christ at the time of his death.',
    image:
      'https://images.unsplash.com/photo-1583778175782-d1d494957d77?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4,
    location: 'Font de Canaletes',
    district: 'Ciutat Vella',
    type: 'Legend',
    text: 'Located at the top of La Rambla, this 19th-century fountain is the gathering point for FC Barcelona celebrations. Legend promises that anyone who drinks its water will eventually return to the city.',
    image:
      'https://images.unsplash.com/photo-1512411082531-d859f931d87f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 5,
    location: 'Columbus Monument',
    district: 'Ciutat Vella',
    type: 'Curiosity',
    text: 'The statue of Christopher Columbus points toward the sea, but not toward the Americas. He is actually pointing southeast, roughly in the direction of his supposed birthplace, Genoa.',
    image:
      'https://images.unsplash.com/photo-1520112460341-35639f727402?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 6,
    location: "Carrer d'Avinyó",
    district: 'Ciutat Vella',
    type: 'Art',
    text: "This street once housed a famous brothel visited by a young Pablo Picasso. The women working there inspired his groundbreaking cubist masterpiece, 'Les Demoiselles d'Avignon'.",
    image:
      'https://images.unsplash.com/photo-1505322022379-7c3353ee6291?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 7,
    location: 'Temple of Augustus',
    district: 'Ciutat Vella',
    type: 'History',
    text: 'Inside the courtyard of the Centre Excursionista de Catalunya, four massive Roman columns stand hidden. They are over 2,000 years old and were part of the forum of the original Roman colony, Barcino.',
    image:
      'https://images.unsplash.com/photo-1514813482567-2858e6c00ee1?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 8,
    location: 'Carrer de Montcada',
    district: 'Ciutat Vella',
    type: 'Culture',
    text: "This was the most prestigious street in medieval Barcelona, lined with Gothic palaces. Today, five of these interconnected palaces house the Picasso Museum, the city's most visited art gallery.",
    image:
      'https://images.unsplash.com/photo-1503917988258-f19c08679093?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 9,
    location: 'Santa Maria del Mar',
    district: 'Ciutat Vella',
    type: 'History',
    text: "Known as the 'Cathedral of the Sea,' it was built entirely by the local port workers (bastaixos) who carried heavy stones from Montjuïc on their backs. Look at the main doors to see carvings honoring these workers.",
    image:
      'https://images.unsplash.com/photo-1533602161203-d64e9a11a2f6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 10,
    location: 'Casa Batlló',
    district: 'Eixample',
    type: 'Architecture',
    text: "The roof of this Gaudí masterpiece represents the back of the dragon slain by Saint George. The balconies are designed to look like the skulls of the dragon's victims, while the pillars resemble their bones.",
    image:
      'https://images.unsplash.com/photo-1563297050-48413b91c828?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 11,
    location: 'Passeig de Gràcia',
    district: 'Eixample',
    type: 'Art',
    text: 'The hexagonal paving stones on this street were designed by Antoni Gaudí himself. They feature marine motifs like starfish and snails, originally intended for the floor of Casa Batlló.',
    image:
      'https://images.unsplash.com/photo-1549144511-f099e773c147?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 12,
    location: 'Plaça de Catalunya',
    district: 'Eixample',
    type: 'History',
    text: "This massive square is the heart of the city but didn't exist until 1927. Before the 1888 Expo, it was an empty space where the city walls had been torn down to connect the old city with the new Eixample.",
    image:
      'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 13,
    location: 'La Pedrera (Casa Milà)',
    district: 'Eixample',
    type: 'Architecture',
    text: "Locals initially hated Gaudí's building, calling it 'La Pedrera' (The Quarry) because of its rough stone appearance. Its wavy stone structure was so heavy that it required innovative internal steel supports.",
    image:
      'https://images.unsplash.com/photo-1561501900-3701fa6a0864?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 14,
    location: 'Carrer dels Mirallers',
    district: 'Ciutat Vella',
    type: 'Curiosity',
    text: "Look at the corner of the building for a 'Carassa' (a stone face). In medieval times, these faces signaled to illiterate sailors where the local brothels were located.",
    image:
      'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 15,
    location: 'Plaça de George Orwell',
    district: 'Ciutat Vella',
    type: 'Curiosity',
    text: "Known to locals as 'Trippy Square,' it was named after the author of '1984.' Ironically, it was the first place in Barcelona to have permanent police surveillance cameras installed.",
    image:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 16,
    location: 'Bunkers del Carmel',
    district: 'Horta-Guinardó',
    type: 'History',
    text: 'These are not actually bunkers but anti-aircraft battery bases from the Civil War. After the war, the area became a shanty town (barraquisme) before being renovated for the public view.',
    image:
      'https://images.unsplash.com/photo-1527473350117-7cc87042d330?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 17,
    location: 'Arc de Triomf',
    district: 'Eixample',
    type: 'Architecture',
    text: "Unlike the Arc de Triomphe in Paris, which celebrates military victories, Barcelona's arch was built as the gateway to the 1888 Universal Exhibition and represents civil and economic progress.",
    image:
      'https://images.unsplash.com/photo-1558642084-fd07fae5282e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 18,
    location: 'Mercat de Sant Josep de la Boqueria',
    district: 'Ciutat Vella',
    type: 'Food',
    text: "The market began as a traveling street market in 1217. Its iconic modernist metal roof wasn't built until 1914, turning it into the permanent culinary landmark it is today.",
    image:
      'https://images.unsplash.com/photo-1541544186542-a63328e93344?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 19,
    location: 'Carrer de Petritxol',
    district: 'Ciutat Vella',
    type: 'Culture',
    text: "This was the first pedestrian-only street in Barcelona, converted in 1959. It is famous for its 'granges' serving thick hot chocolate and its ceramic plaques documenting the street's history.",
    image:
      'https://images.unsplash.com/photo-1503917988258-f19c08679093?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 20,
    location: 'Barcelona Cathedral',
    district: 'Ciutat Vella',
    type: 'Legend',
    text: "In the cathedral's cloister, you will find 13 white geese. They represent the age of Saint Eulalia, the city's co-patron saint, who was martyred by the Romans at 13.",
    image:
      'https://images.unsplash.com/photo-1550586678-f7225f03c44b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 21,
    location: "Casa de l'Ardiaca",
    district: 'Ciutat Vella',
    type: 'Art',
    text: 'Look for the marble mailbox designed by Lluis Domènech i Montaner. The swallows represent the speed of justice, while the tortoise represents the reality of the slow legal system.',
    image:
      'https://images.unsplash.com/photo-1512411082531-d859f931d87f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 22,
    location: 'Park Güell',
    district: 'Gràcia',
    type: 'History',
    text: 'Gaudí originally designed this as a private, high-end housing estate for 60 families. It was a commercial failure, with only two houses ever built, leading it to become a public park.',
    image:
      'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 23,
    location: 'Carrer de la Portaferrissa',
    district: 'Ciutat Vella',
    type: 'History',
    text: "Named 'Iron Gate' because a metal rod was kept here so farmers could measure their carts before entering the narrow city streets to avoid getting stuck.",
    image:
      'https://images.unsplash.com/photo-1549144511-f099e773c147?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 24,
    location: 'Carrer de les Mosques',
    district: 'Ciutat Vella',
    type: 'Curiosity',
    text: "This is one of the narrowest streets in Barcelona. Its name, 'Street of the Flies,' comes from the swarms that used to follow the waste from the nearby meat markets.",
    image:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 25,
    location: 'Plaça Reial',
    district: 'Ciutat Vella',
    type: 'Art',
    text: "The lanterns with the winged helmets were Antoni Gaudí's first commission for the city after graduating. He was only 26 years old at the time.",
    image:
      'https://images.unsplash.com/photo-1563297050-48413b91c828?auto=format&fit=crop&w=800&q=80',
  },
];

const GENERIC_IMAGES = [
  'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800', // Park Guell
  'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=800', // Sagrada
  'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?w=800', // Streets
  'https://images.unsplash.com/photo-1579282240050-352db0a14c21?w=800', // Rambla
  'https://images.unsplash.com/photo-1558642084-fd07fae5282e?w=800', // Beach
  'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800', // Street
];

function getRandomImage() {
  return GENERIC_IMAGES[Math.floor(Math.random() * GENERIC_IMAGES.length)];
}

/**
 * Clean street name for fuzzy matching
 */
const simplify = name => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .replace(
      /^(carrer|avinguda|plaça|passeig|passatge|ronda|via|camí|parc|jardins|rambla)\s+(de\s+|del\s+|d'|els\s+)?/i,
      ''
    ) // prefixes
    .replace(/[^a-z0-9]/g, ''); // punctuation
};

/**
 * Get a curiosity based on the streets played in the quiz.
 * @param {Array} quizStreets - Array of street objects from the daily quiz
 * @returns {Object} - Curiosity object with image, fact, and location
 */
import { seededRandom, getTodaySeed } from '../utils/dailyChallenge';

/**
 * Get a curiosity based on the streets played in the quiz.
 * @param {Array} quizStreets - Array of street objects from the daily quiz
 * @param {number} [dateSeed] - Optional date seed for deterministic fallback
 * @returns {Object} - Curiosity object with image, fact, and location
 */
export function getCuriosityByStreets(quizStreets, dateSeed) {
  const seed = dateSeed || getTodaySeed();

  if (!quizStreets || quizStreets.length === 0) {
    // Fallback deterministic
    const index = Math.floor(seededRandom(seed) * CURIOSITIES_DATA.length);
    const random = CURIOSITIES_DATA[index];
    const imgIndex = Math.floor(seededRandom(seed + 1) * GENERIC_IMAGES.length);
    return {
      title: random.location,
      fact: random.text,
      image: random.image || GENERIC_IMAGES[imgIndex],
      location: random.location,
      matchedStreet: null,
    };
  }

  // Try to find a match - check each street against curiosities
  for (const street of quizStreets) {
    const simpleName = simplify(street.name);

    // Find a curiosity where the location name matches loosely
    const match = CURIOSITIES_DATA.find(c => {
      const simpleLoc = simplify(c.location);
      // Check both directions for substring matching
      return simpleName.includes(simpleLoc) || simpleLoc.includes(simpleName);
    });

    if (match) {
      return {
        title: match.location,
        fact: match.text,
        image: match.image || getRandomImage(), // Keep random per reload if matched? No, should be consistent too
        location: match.location,
        matchedStreet: street.name, // Include which street matched
      };
    }
  }

  // No match found? Pick a deterministically random curiosity
  const index = Math.floor(seededRandom(seed + 2) * CURIOSITIES_DATA.length);
  const random = CURIOSITIES_DATA[index];
  const imgIndex = Math.floor(seededRandom(seed + 3) * GENERIC_IMAGES.length);

  return {
    title: random.location,
    fact: random.text,
    image: random.image || GENERIC_IMAGES[imgIndex],
    location: random.location,
    matchedStreet: null,
  };
}
