export interface MemberDetails {
  name: string;
  hcp: string;
  spitzname?: string;
  geboren?: string;
  firma?: string;
  beruf?: string;
  handy?: string;
  email?: string;
  web?: string;
  imageSrc: string;
  verstorben?: string;
}

export interface MemberData {
  gruendungsmitglieder: MemberDetails[];
  ordentlicheMitglieder: MemberDetails[];
  inMemoriam: MemberDetails[];
}