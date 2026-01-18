export interface District {
  id: string;
  name: string;
  teamName: string;
  color: string;
  logo: string;
}

export const DISTRICTS: District[] = [
  {
    id: 'ciutat_vella',
    name: 'Ciutat Vella',
    teamName: 'Ciutat Vella Gargoyles',
    color: 'from-purple-500 to-indigo-600',
    logo: '/assets/districts/pixel_gargoyle.png',
  },
  {
    id: 'eixample',
    name: 'Eixample',
    teamName: 'Eixample Dragons',
    color: 'from-red-500 to-orange-600',
    logo: '/assets/districts/pixel_dragon.png',
  },
  {
    id: 'sants_montjuic',
    name: 'Sants-Montjuïc',
    teamName: 'Sants Lions',
    color: 'from-yellow-400 to-amber-600',
    logo: '/assets/districts/pixel_lion.png',
  },
  {
    id: 'les_corts',
    name: 'Les Corts',
    teamName: 'Les Corts Eagles',
    color: 'from-blue-500 to-sky-600',
    logo: '/assets/districts/pixel_eagle.png',
  },
  {
    id: 'sarria_sant_gervasi',
    name: 'Sarrià-Sant Gervasi',
    teamName: 'Sarrià Foxes',
    color: 'from-orange-500 to-amber-500',
    logo: '/assets/districts/pixel_fox.png',
  },
  {
    id: 'gracia',
    name: 'Gràcia',
    teamName: 'Gràcia Cats',
    color: 'from-green-500 to-emerald-600',
    logo: '/assets/districts/pixel_cat.png',
  },
  {
    id: 'horta_guinardo',
    name: 'Horta-Guinardó',
    teamName: 'Horta Boars',
    color: 'from-amber-700 to-orange-800',
    logo: '/assets/districts/pixel_boar.png',
  },
  {
    id: 'nou_barris',
    name: 'Nou Barris',
    teamName: 'Nou Barris Wolves',
    color: 'from-slate-500 to-zinc-600',
    logo: '/assets/districts/pixel_wolf.png',
  },
  {
    id: 'sant_andreu',
    name: 'Sant Andreu',
    teamName: 'Sant Andreu Bears',
    color: 'from-teal-500 to-emerald-700',
    logo: '/assets/districts/pixel_bear.png',
  },
  {
    id: 'sant_marti',
    name: 'Sant Martí',
    teamName: 'Sant Martí Sharks',
    color: 'from-cyan-500 to-blue-600',
    logo: '/assets/districts/pixel_shark.png',
  },
];
