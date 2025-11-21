"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Mail, Lock, User, ArrowRight, Dumbbell, AlertCircle } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Verificar se o Supabase está configurado
    if (!isSupabaseConfigured()) {
      setError("Configure o Supabase nas Configurações do Projeto → Integrações para usar autenticação.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuthSuccess();
      } else {
        // Registro
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
          },
        });
        if (error) throw error;
        
        // Perfil será criado automaticamente via trigger no Supabase
        // ou pode ser criado posteriormente quando necessário
        
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#121212] via-[#1a1a1a] to-[#121212] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
              <Dumbbell className="w-10 h-10" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            TrainX
          </h1>
          <p className="text-gray-400">
            {isLogin ? "Bem-vindo de volta!" : "Comece sua jornada fitness"}
          </p>
        </div>

        {/* Aviso de configuração */}
        {!isSupabaseConfigured() && (
          <div className="bg-orange-500/10 border border-orange-500 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-200">
              <p className="font-semibold mb-1">Supabase não configurado</p>
              <p className="text-orange-300/80">
                Conecte sua conta Supabase em <strong>Configurações → Integrações</strong> para usar autenticação e banco de dados.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-xl p-3 text-red-500 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured()}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-semibold text-lg hover:scale-105 transition-transform duration-200 shadow-lg shadow-orange-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              "Carregando..."
            ) : (
              <>
                {isLogin ? "Entrar" : "Criar Conta"}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Login/Register */}
        <div className="text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isLogin ? (
              <>
                Não tem conta? <span className="text-orange-500 font-semibold">Cadastre-se</span>
              </>
            ) : (
              <>
                Já tem conta? <span className="text-orange-500 font-semibold">Faça login</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
