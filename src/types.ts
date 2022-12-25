export type MetaDataAttribute = {
  trait_type: string;
  value: string;
  display_type?: string;
}

export type MetaData = {
  id: number;
  attributes: MetaDataAttribute[];
}
