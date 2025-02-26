import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Typen für die Datenbank-Tabellen
export type Database = {
  public: {
    Tables: {
      members: {
        Row: {
          id: number;
          name: string;
          hcp: string;
          spitzname: string | null;
          geboren: string | null;
          beruf: string | null;
          handy: string | null;
          email: string | null;
          web: string | null;
          imageSrc: string;
          verstorben: string | null;
          category: 'gruendungsmitglieder' | 'ordentlicheMitglieder' | 'inMemoriam';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['members']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['members']['Insert']>;
      };
    };
  };
};