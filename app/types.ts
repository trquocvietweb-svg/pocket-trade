export enum PokemonType {
  FIRE = 'Fire',
  WATER = 'Water',
  GRASS = 'Grass',
  LIGHTNING = 'Lightning',
  PSYCHIC = 'Psychic',
  COLORLESS = 'Colorless',
  FIGHTING = 'Fighting',
  DARKNESS = 'Darkness',
  METAL = 'Metal',
  DRAGON = 'Dragon'
}

export type CardCategory = 'Pokemon' | 'Trainer';

export interface PokemonCard {
  id: string;
  name: string;
  hp: number;
  type: PokemonType;
  rarity: number;
  rarityName?: string;
  rarityImageUrl?: string;
  imageUrl: string;
  subName: string;
  collection: string;
  category: CardCategory;
  cardNumber?: string;
  setCode?: string;
}

export type SortOption = 'ID' | 'NAME' | 'TYPE';
export type SortDirection = 'ASC' | 'DESC';

export interface FilterState {
  category: CardCategory | 'All';
  collection: string | 'All';
  type: PokemonType | 'All';
}
