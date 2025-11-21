"use client";

import { useState, useEffect } from "react";
import { Play, Clock, Trophy, User, Star, Lock, ChevronRight, Check, Dumbbell, Flame, Target, Award, Calendar, TrendingUp, Crown, Zap, LogOut } from "lucide-react";
import WorkoutDetail from "@/components/WorkoutDetail";
import AuthScreen from "@/components/AuthScreen";
import { supabase } from "@/lib/supabase";
import { getStripe, STRIPE_PRICES } from "@/lib/stripe";
import { createCheckoutSession } from "@/app/actions/stripe";

type Section = "onboarding" | "home" | "workout-detail" | "progress" | "profile" | "premium";
type Level = "Iniciante" | "Intermediário" | "Avançado";

interface Exercise {
  id: number;
  name: string;
  duration: number; // em segundos
  instructions: string;
  videoUrl: string;
  isPremium?: boolean;
}

interface Workout {
  id: number;
  title: string;
  duration: string;
  type: string;
  level: Level;
  exercises: Exercise[];
  isPremium?: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  level: Level;
  is_premium: boolean;
  streak: number;
  total_workouts: number;
  total_time: number;
}

interface WorkoutHistoryItem {
  id: string;
  workout_title: string;
  duration: number;
  completed_at: string;
}

const workouts: Workout[] = [
  {
    id: 1,
    title: "Treino A: Corpo Inteiro",
    duration: "15 min",
    type: "Corpo Inteiro",
    level: "Iniciante",
    exercises: [
      { 
        id: 1, 
        name: "Agachamento", 
        duration: 45, 
        instructions: "Mantenha as costas retas e desça até 90 graus. Pés na largura dos ombros.", 
        videoUrl: "https://www.youtube.com/watch?v=aclHkVaku9U" 
      },
      { 
        id: 2, 
        name: "Flexão", 
        duration: 30, 
        instructions: "Mantenha o corpo alinhado e desça controladamente. Cotovelos a 45 graus.", 
        videoUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4" 
      },
      { 
        id: 3, 
        name: "Prancha", 
        duration: 30, 
        instructions: "Mantenha o core contraído e o corpo reto como uma tábua.", 
        videoUrl: "https://www.youtube.com/watch?v=ASdvN_XEl_c" 
      },
    ],
  },
  {
    id: 2,
    title: "Treino B: HIIT",
    duration: "20 min",
    type: "HIIT",
    level: "Intermediário",
    exercises: [
      { 
        id: 1, 
        name: "Burpees", 
        duration: 40, 
        instructions: "Movimento explosivo completo: agachamento, prancha, flexão, salto.", 
        videoUrl: "https://www.youtube.com/watch?v=JZQA08SlJnM",
        isPremium: true
      },
      { 
        id: 2, 
        name: "Mountain Climbers", 
        duration: 40, 
        instructions: "Alterne as pernas rapidamente mantendo o core ativado.", 
        videoUrl: "https://www.youtube.com/watch?v=nmwgirgXLYM",
        isPremium: true
      },
      { 
        id: 3, 
        name: "Jump Squats", 
        duration: 40, 
        instructions: "Agachamento com salto explosivo. Aterrisse suavemente.", 
        videoUrl: "https://www.youtube.com/watch?v=A-cFYWvaHr0",
        isPremium: true
      },
    ],
    isPremium: true,
  },
  {
    id: 3,
    title: "Treino C: Alongamento",
    duration: "10 min",
    type: "Alongamento",
    level: "Iniciante",
    exercises: [
      { 
        id: 1, 
        name: "Alongamento de Pernas", 
        duration: 60, 
        instructions: "Estique suavemente sem forçar. Respire profundamente.", 
        videoUrl: "https://www.youtube.com/watch?v=g_tea8ZNk5A" 
      },
      { 
        id: 2, 
        name: "Alongamento de Braços", 
        duration: 60, 
        instructions: "Mantenha a posição por 30s cada lado. Sem dor.", 
        videoUrl: "https://www.youtube.com/watch?v=SSbX4tm4rJE" 
      },
      { 
        id: 3, 
        name: "Alongamento de Costas", 
        duration: 60, 
        instructions: "Respire profundamente durante o alongamento. Relaxe os ombros.", 
        videoUrl: "https://www.youtube.com/watch?v=4BOTvaRaDjI" 
      },
    ],
  },
];

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentSection, setCurrentSection] = useState<Section>("onboarding");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<Level | "Todos">("Todos");
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const onboardingSlides = [
    {
      title: "Treine em Casa",
      text: "Treine no seu ritmo, sem precisar de academia.",
      icon: <Dumbbell className="w-24 h-24 text-orange-500" />,
    },
    {
      title: "Treinos Personalizados",
      text: "Vídeos guiados e planos diários adaptados ao seu nível.",
      icon: <Target className="w-24 h-24 text-orange-500" />,
    },
    {
      title: "Acompanhe Seu Progresso",
      text: "Conquiste metas, desbloqueie badges e acompanhe evolução.",
      icon: <Trophy className="w-24 h-24 text-orange-500" />,
    },
  ];

  // Verificar autenticação
  useEffect(() => {
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        loadUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setIsAuthenticated(true);
      await loadUserData(session.user.id);
    }
    setLoading(false);
  };

  const loadUserData = async (userId: string) => {
    try {
      // Carregar perfil
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        setUserProfile(profile);
      }

      // Carregar histórico
      const { data: history } = await supabase
        .from('workout_history')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (history) {
        setWorkoutHistory(history);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentSection("onboarding");
  };

  const filteredWorkouts = selectedLevel === "Todos" 
    ? workouts 
    : workouts.filter(w => w.level === selectedLevel);

  const startWorkout = (workout: Workout) => {
    if (workout.isPremium && !userProfile?.is_premium) {
      setCurrentSection("premium");
      return;
    }
    setSelectedWorkout(workout);
    setCurrentSection("workout-detail");
  };

  const finishWorkout = async () => {
    if (!userProfile || !selectedWorkout) return;

    try {
      // Salvar no histórico
      await supabase.from('workout_history').insert([
        {
          user_id: userProfile.id,
          workout_title: selectedWorkout.title,
          duration: parseInt(selectedWorkout.duration),
          completed_at: new Date().toISOString(),
        },
      ]);

      // Atualizar estatísticas do usuário
      await supabase
        .from('user_profiles')
        .update({
          total_workouts: userProfile.total_workouts + 1,
          total_time: userProfile.total_time + parseInt(selectedWorkout.duration),
          streak: userProfile.streak + 1,
        })
        .eq('id', userProfile.id);

      // Recarregar dados
      await loadUserData(userProfile.id);
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
    }

    setSelectedWorkout(null);
    setCurrentSection("progress");
  };

  const handleSubscribe = async (priceId: string) => {
    if (!userProfile) return;

    try {
      const { sessionId } = await createCheckoutSession(priceId, userProfile.id);
      const stripe = await getStripe();
      if (stripe && sessionId) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  // Onboarding Section
  if (currentSection === "onboarding") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#121212] via-[#1a1a1a] to-[#121212]">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center space-y-6">
            <div className="flex justify-center animate-bounce-in">
              {onboardingSlides[onboardingStep].icon}
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              {onboardingSlides[onboardingStep].title}
            </h1>
            <p className="text-lg text-gray-300">
              {onboardingSlides[onboardingStep].text}
            </p>
          </div>

          <div className="flex justify-center gap-2">
            {onboardingSlides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === onboardingStep ? "w-8 bg-orange-500" : "w-2 bg-gray-600"
                }`}
              />
            ))}
          </div>

          <div className="space-y-3">
            {onboardingStep < onboardingSlides.length - 1 ? (
              <button
                onClick={() => setOnboardingStep(onboardingStep + 1)}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-semibold text-lg hover:scale-105 transition-transform duration-200 shadow-lg shadow-orange-500/50"
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={() => setCurrentSection("home")}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-semibold text-lg hover:scale-105 transition-transform duration-200 shadow-lg shadow-orange-500/50"
              >
                Começar Agora
              </button>
            )}
            {onboardingStep > 0 && (
              <button
                onClick={() => setCurrentSection("home")}
                className="w-full py-3 text-gray-400 hover:text-white transition-colors"
              >
                Pular
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Home Section
  if (currentSection === "home") {
    return (
      <div className="min-h-screen bg-[#121212] pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-b-3xl shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Olá, {userProfile?.name}! 👋</h1>
              <p className="text-orange-100 mt-1">Pronto para treinar hoje?</p>
            </div>
            <button
              onClick={() => setCurrentSection("profile")}
              className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-all"
            >
              <User className="w-6 h-6" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <Flame className="w-6 h-6 mx-auto mb-1" />
              <p className="text-2xl font-bold">{userProfile?.streak || 0}</p>
              <p className="text-xs text-orange-100">Dias seguidos</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <Trophy className="w-6 h-6 mx-auto mb-1" />
              <p className="text-2xl font-bold">{userProfile?.total_workouts || 0}</p>
              <p className="text-xs text-orange-100">Treinos</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <Clock className="w-6 h-6 mx-auto mb-1" />
              <p className="text-2xl font-bold">{Math.floor((userProfile?.total_time || 0) / 60)}h</p>
              <p className="text-xs text-orange-100">Total</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold">Treinos do Dia</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {["Todos", "Iniciante", "Intermediário", "Avançado"].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level as Level | "Todos")}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedLevel === level
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Workouts List */}
          <div className="space-y-4">
            {filteredWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 hover:scale-[1.02] transition-transform duration-200 shadow-xl relative overflow-hidden"
              >
                {workout.isPremium && (
                  <div className="absolute top-3 right-3">
                    <Crown className="w-6 h-6 text-yellow-400" />
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{workout.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {workout.duration}
                      </span>
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                        {workout.level}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => startWorkout(workout)}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/50 transition-all flex items-center justify-center gap-2"
                >
                  {workout.isPremium && !userProfile?.is_premium ? (
                    <>
                      <Lock className="w-5 h-5" />
                      Desbloquear Premium
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Iniciar Treino
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-6 py-4">
          <div className="flex justify-around items-center max-w-md mx-auto">
            <button onClick={() => setCurrentSection("home")} className="flex flex-col items-center gap-1 text-orange-500">
              <Dumbbell className="w-6 h-6" />
              <span className="text-xs">Treinos</span>
            </button>
            <button onClick={() => setCurrentSection("progress")} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
              <Trophy className="w-6 h-6" />
              <span className="text-xs">Progresso</span>
            </button>
            <button onClick={() => setCurrentSection("premium")} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
              <Crown className="w-6 h-6" />
              <span className="text-xs">Premium</span>
            </button>
            <button onClick={() => setCurrentSection("profile")} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
              <User className="w-6 h-6" />
              <span className="text-xs">Perfil</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Workout Detail Section
  if (currentSection === "workout-detail" && selectedWorkout) {
    return <WorkoutDetail workout={selectedWorkout} onFinish={finishWorkout} isPremium={userProfile?.is_premium || false} />;
  }

  // Progress Section
  if (currentSection === "progress") {
    const weeklyData = [60, 80, 40, 90, 70, 0, 0]; // Mock data - pode ser calculado do histórico
    
    return (
      <div className="min-h-screen bg-[#121212] pb-20">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-b-3xl">
          <button
            onClick={() => setCurrentSection("home")}
            className="text-white mb-4 flex items-center gap-2"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold mb-2">Seu Progresso</h1>
          <p className="text-orange-100">Continue assim! 🔥</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Weekly Chart */}
          <div className="bg-gray-800 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Treinos desta Semana
            </h3>
            <div className="flex items-end justify-between h-40 gap-2">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day, index) => {
                const height = weeklyData[index];
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-700 rounded-t-lg relative" style={{ height: `${height}%` }}>
                      {height > 0 && (
                        <div className="absolute inset-0 bg-gradient-to-t from-orange-500 to-red-500 rounded-t-lg" />
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gray-800 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Estatísticas
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Sequência Atual</span>
                <span className="text-2xl font-bold text-orange-500">{userProfile?.streak || 0} dias 🔥</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total de Treinos</span>
                <span className="text-2xl font-bold">{userProfile?.total_workouts || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Tempo Total</span>
                <span className="text-2xl font-bold">{Math.floor((userProfile?.total_time || 0) / 60)}h {(userProfile?.total_time || 0) % 60}min</span>
              </div>
            </div>
          </div>

          {/* Recent History */}
          <div className="bg-gray-800 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Histórico Recente
            </h3>
            <div className="space-y-3">
              {workoutHistory.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                  <div>
                    <p className="font-semibold">{item.workout_title}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(item.completed_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className="text-orange-500 font-semibold">{item.duration} min</span>
                </div>
              ))}
              {workoutHistory.length === 0 && (
                <p className="text-gray-400 text-center py-4">Nenhum treino realizado ainda</p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-6 py-4">
          <div className="flex justify-around items-center max-w-md mx-auto">
            <button onClick={() => setCurrentSection("home")} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
              <Dumbbell className="w-6 h-6" />
              <span className="text-xs">Treinos</span>
            </button>
            <button onClick={() => setCurrentSection("progress")} className="flex flex-col items-center gap-1 text-orange-500">
              <Trophy className="w-6 h-6" />
              <span className="text-xs">Progresso</span>
            </button>
            <button onClick={() => setCurrentSection("premium")} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
              <Crown className="w-6 h-6" />
              <span className="text-xs">Premium</span>
            </button>
            <button onClick={() => setCurrentSection("profile")} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
              <User className="w-6 h-6" />
              <span className="text-xs">Perfil</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Premium Section
  if (currentSection === "premium") {
    return (
      <div className="min-h-screen bg-[#121212] pb-20">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 rounded-b-3xl">
          <button
            onClick={() => setCurrentSection("home")}
            className="text-white mb-4 flex items-center gap-2"
          >
            ← Voltar
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-10 h-10" />
            <h1 className="text-3xl font-bold">Premium</h1>
          </div>
          <p className="text-yellow-100">Desbloqueie todo o potencial</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Premium Features */}
          <div className="space-y-3">
            {[
              { icon: <Zap className="w-6 h-6" />, text: "Todos os treinos avançados" },
              { icon: <Target className="w-6 h-6" />, text: "Planos semanais personalizados" },
              { icon: <Trophy className="w-6 h-6" />, text: "Desafios exclusivos" },
              { icon: <Star className="w-6 h-6" />, text: "Vídeos extras e tutoriais" },
              { icon: <TrendingUp className="w-6 h-6" />, text: "Análise detalhada de progresso" },
              { icon: <Award className="w-6 h-6" />, text: "Badges e conquistas exclusivas" },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-xl p-4 flex items-center gap-4 hover:bg-gray-750 transition-colors"
              >
                <div className="text-yellow-500">{feature.icon}</div>
                <span className="text-gray-200">{feature.text}</span>
                <Check className="w-5 h-5 text-green-500 ml-auto" />
              </div>
            ))}
          </div>

          {/* Pricing Plans */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Escolha seu Plano</h3>
            
            {/* Monthly Plan */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border-2 border-gray-700 hover:border-orange-500 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-bold">Mensal</h4>
                  <p className="text-gray-400 text-sm">Acesso completo</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">R$ 29,90</p>
                  <p className="text-gray-400 text-sm">/mês</p>
                </div>
              </div>
              <button
                onClick={() => handleSubscribe(STRIPE_PRICES.monthly)}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/50 transition-all"
              >
                Assinar Mensal
              </button>
            </div>

            {/* Annual Plan */}
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-white text-orange-600 px-3 py-1 rounded-full text-xs font-bold">
                ECONOMIZE 40%
              </div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-bold text-white">Anual</h4>
                  <p className="text-yellow-100 text-sm">Melhor valor</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">R$ 179,90</p>
                  <p className="text-yellow-100 text-sm">/ano</p>
                  <p className="text-xs text-yellow-100">R$ 14,99/mês</p>
                </div>
              </div>
              <button
                onClick={() => handleSubscribe(STRIPE_PRICES.annual)}
                className="w-full py-3 bg-white text-orange-600 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Assinar Anual
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-6 py-4">
          <div className="flex justify-around items-center max-w-md mx-auto">
            <button onClick={() => setCurrentSection("home")} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
              <Dumbbell className="w-6 h-6" />
              <span className="text-xs">Treinos</span>
            </button>
            <button onClick={() => setCurrentSection("progress")} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
              <Trophy className="w-6 h-6" />
              <span className="text-xs">Progresso</span>
            </button>
            <button onClick={() => setCurrentSection("premium")} className="flex flex-col items-center gap-1 text-orange-500">
              <Crown className="w-6 h-6" />
              <span className="text-xs">Premium</span>
            </button>
            <button onClick={() => setCurrentSection("profile")} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
              <User className="w-6 h-6" />
              <span className="text-xs">Perfil</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Profile Section
  if (currentSection === "profile") {
    return (
      <div className="min-h-screen bg-[#121212] pb-20">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-b-3xl">
          <button
            onClick={() => setCurrentSection("home")}
            className="text-white mb-4 flex items-center gap-2"
          >
            ← Voltar
          </button>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{userProfile?.name}</h1>
              <p className="text-orange-100">Nível {userProfile?.level}</p>
              {userProfile?.is_premium && (
                <div className="flex items-center gap-1 mt-1">
                  <Crown className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm text-yellow-300">Membro Premium</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Goals */}
          <div className="bg-gray-800 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" />
              Metas Atuais
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Treinos esta semana</span>
                  <span className="font-semibold">5/7</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" style={{ width: "71%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Meta mensal</span>
                  <span className="font-semibold">{userProfile?.total_workouts || 0}/25</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" style={{ width: `${Math.min(((userProfile?.total_workouts || 0) / 25) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-gray-800 rounded-2xl p-5">
            <h3 className="font-semibold mb-4">Configurações</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between py-3 hover:bg-gray-700 rounded-lg px-3 transition-colors">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-orange-500" />
                  <span>Notificações</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              
              {userProfile?.is_premium && (
                <button className="w-full flex items-center justify-between py-3 hover:bg-gray-700 rounded-lg px-3 transition-colors">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    <span>Gerenciar Assinatura</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between py-3 hover:bg-red-500/10 rounded-lg px-3 transition-colors text-red-500"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5" />
                  <span>Sair</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-6 py-4">
          <div className="flex justify-around items-center max-w-md mx-auto">
            <button onClick={() => setCurrentSection("home")} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
              <Dumbbell className="w-6 h-6" />
              <span className="text-xs">Treinos</span>
            </button>
            <button onClick={() => setCurrentSection("progress")} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
              <Trophy className="w-6 h-6" />
              <span className="text-xs">Progresso</span>
            </button>
            <button onClick={() => setCurrentSection("premium")} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
              <Crown className="w-6 h-6" />
              <span className="text-xs">Premium</span>
            </button>
            <button onClick={() => setCurrentSection("profile")} className="flex flex-col items-center gap-1 text-orange-500">
              <User className="w-6 h-6" />
              <span className="text-xs">Perfil</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
