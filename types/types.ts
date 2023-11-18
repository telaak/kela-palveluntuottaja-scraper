import { Kuntoutusmuoto, Laji, Suuntaus } from "./enums";

export type TherapistSnippet = {
  name: string;
  location: string;
  phoneNumbers: string[];
  links: string[];
};

export type Kuntoutus = {
  muoto: Kuntoutusmuoto;
  lajit: Laji[];
};

export type Therapist = {
  name: string;
  locations: string[];
  phoneNumbers: string[];
  email: string | null;
  homepage: string | null;
  languages: string[];
  orientations: Suuntaus[];
  therapies: Kuntoutus[];
};
