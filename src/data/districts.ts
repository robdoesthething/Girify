export interface District {
  id: string;
  name: string;
  teamName: string;
  color: string;
  logo: string;
  animalName: string;
}

export const DISTRICTS: District[] = [
  {
    id: 'ciutat_vella',
    name: 'Ciutat Vella',
    teamName: 'Ciutat Vella Bats',
    color: 'from-purple-500 to-indigo-600',
    logo: '/assets/districts/pixel_bat.png',
    animalName: 'Bats',
  },
  {
    id: 'eixample',
    name: 'Eixample',
    teamName: 'Eixample Dragons',
    color: 'from-red-500 to-orange-600',
    logo: '/assets/districts/pixel_dragon.png',
    animalName: 'Dragons',
  },
  {
    id: 'sants_montjuic',
    name: 'Sants-Montjuïc',
    teamName: 'Sants Lions',
    color: 'from-yellow-400 to-amber-600',
    logo: '/assets/districts/pixel_lion.png',
    animalName: 'Lions',
  },
  {
    id: 'les_corts',
    name: 'Les Corts',
    teamName: 'Les Corts Eagles',
    color: 'from-blue-500 to-sky-600',
    logo: '/assets/districts/pixel_eagle.png',
    animalName: 'Eagles',
  },
  {
    id: 'sarria_sant_gervasi',
    name: 'Sarrià-Sant Gervasi',
    teamName: 'Sarrià Foxes',
    color: 'from-orange-500 to-amber-500',
    logo: '/assets/districts/pixel_fox.png',
    animalName: 'Foxes',
  },
  {
    id: 'gracia',
    name: 'Gràcia',
    teamName: 'Gràcia Cats',
    color: 'from-green-500 to-emerald-600',
    logo: '/assets/districts/pixel_cat.png',
    animalName: 'Cats',
  },
  {
    id: 'horta_guinardo',
    name: 'Horta-Guinardó',
    teamName: 'Horta Boars',
    color: 'from-amber-700 to-orange-800',
    logo: '/assets/districts/pixel_boar.png',
    animalName: 'Boars',
  },
  {
    id: 'nou_barris',
    name: 'Nou Barris',
    teamName: 'Nou Barris Wolves',
    color: 'from-slate-500 to-zinc-600',
    logo: '/assets/districts/pixel_wolf.png',
    animalName: 'Wolves',
  },
  {
    id: 'sant_andreu',
    name: 'Sant Andreu',
    teamName: 'Sant Andreu Bears',
    color: 'from-teal-500 to-emerald-700',
    logo: '/assets/districts/pixel_bear.png',
    animalName: 'Bears',
  },
  {
    id: 'sant_marti',
    name: 'Sant Martí',
    teamName: 'Sant Martí Sharks',
    color: 'from-cyan-500 to-blue-600',
    logo: '/assets/districts/pixel_shark.png',
    animalName: 'Sharks',
  },
];
