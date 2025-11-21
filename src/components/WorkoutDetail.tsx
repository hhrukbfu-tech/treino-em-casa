"use client";

import { useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { Clock, ChevronRight, Check, Crown } from "lucide-react";

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
  exercises: Exercise[];
}

interface WorkoutDetailProps {
  workout: Workout;
  onFinish: () => void;
  isPremium: boolean;
}

export default function WorkoutDetail({ workout, onFinish, isPremium }: WorkoutDetailProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(workout.exercises[0].duration);

  const exercise = workout.exercises[currentExerciseIndex];

  useEffect(() => {
    setSecondsLeft(exercise.duration);

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          nextExercise();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentExerciseIndex]);

  const nextExercise = () => {
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      onFinish();
    }
  };

  const progress = ((currentExerciseIndex + 1) / workout.exercises.length) * 100;

  // Se exercício é premium e usuário não tem premium, mostra paywall
  if (exercise.isPremium && !isPremium) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6">
        <Crown className="w-24 h-24 text-yellow-400 mb-6 animate-pulse" />
        <h2 className="text-3xl font-bold mb-3 text-center">Conteúdo Premium</h2>
        <p className="text-gray-300 text-center mb-8 max-w-md">
          Este exercício faz parte do conteúdo exclusivo para membros Premium. 
          Desbloqueie agora para acessar todos os treinos avançados!
        </p>
        <button
          onClick={onFinish}
          className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-semibold text-lg hover:scale-105 transition-transform shadow-lg"
        >
          Ver Planos Premium
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      {/* Progress Bar */}
      <div className="bg-gray-900 p-4">
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Video */}
      <div className="relative h-64 bg-gray-900">
        <ReactPlayer
          url={exercise.videoUrl}
          playing
          width="100%"
          height="100%"
          controls
        />
      </div>

      {/* Exercise Info */}
      <div className="flex-1 p-6 space-y-6">
        <h2 className="text-3xl font-bold">{exercise.name}</h2>
        <div className="flex items-center gap-2 text-orange-500">
          <Clock className="w-5 h-5" />
          <span className="text-6xl font-bold">{secondsLeft}s</span>
        </div>
        <div className="bg-gray-800 rounded-2xl p-5">
          <h3 className="font-semibold mb-2">Instruções</h3>
          <p className="text-gray-300">{exercise.instructions}</p>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-6">
        <button
          onClick={nextExercise}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {currentExerciseIndex < workout.exercises.length - 1 ? (
            <>
              Próximo Exercício
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            <>
              Concluir Treino
              <Check className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
