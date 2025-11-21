import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Helper para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co');
};

// Cria um cliente mock que não faz requisições reais
const createMockClient = (): SupabaseClient => {
  const mockError = { message: 'Supabase não configurado. Configure em Configurações → Integrações.' };
  
  return {
    auth: {
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: mockError }),
      signUp: async () => ({ data: { user: null, session: null }, error: mockError }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ data: null, error: mockError }),
      insert: () => ({ data: null, error: mockError }),
      update: () => ({ data: null, error: mockError }),
      delete: () => ({ data: null, error: mockError }),
    }),
  } as any;
};

// Cria o cliente real ou mock
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

// Types para o banco de dados
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  is_premium: boolean;
  streak: number;
  total_workouts: number;
  total_time: number; // em minutos
  created_at: string;
}

export interface WorkoutHistory {
  id: string;
  user_id: string;
  workout_title: string;
  duration: number; // em minutos
  completed_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_name: string;
  earned_at: string;
}
