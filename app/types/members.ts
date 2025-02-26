export interface MemberDetails {
  id?: number;
  name: string;
  hcp: string;
  spitzname?: string;
  geboren?: string;
  beruf?: string;
  handy?: string;
  email?: string;
  web?: string;
  imagesrc: string;
  verstorben?: string;
  category: 'gruendungsmitglieder' | 'ordentlicheMitglieder' | 'inMemoriam';
  created_at?: string;
  updated_at?: string;
  order?: number;
}