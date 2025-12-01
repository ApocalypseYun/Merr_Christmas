export interface TreeState {
  unleashed: boolean; // True = Chaos (Hand Open), False = Formed (Hand Closed)
  cameraDelta: { x: number; y: number }; // -1 to 1 based on hand position
  greetings: string[]; // AI generated greetings
}

export enum ItemType {
  NEEDLE,
  ORNAMENT,
  GIFT,
  POLAROID,
  LIGHT
}
