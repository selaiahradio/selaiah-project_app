import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  Award,
  BookOpen,
  Target,
  Trophy,
  Lock,
  ChevronRight,
  Star,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function VerificationPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const queryClient = useQueryClient();

  // Obtener usuario actual
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        base44.auth.redirectToLogin(window.location.pathname);
      }
    };
    fetchUser();
  }, []);

  // Obtener ejercicios disponibles
  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['verificationExercises'],
    queryFn: () => base44.entities.VerificationExercise.filter({ is_active: true }, 'order'),
    initialData: [],
  });

  // Verificar si el usuario ya completó un ejercicio
  const hasCompletedExercise = (exerciseId) => {
    return currentUser?.verification_exercises_completed?.some(
      ex => ex.exercise_id === exerciseId
    );
  };

  // Obtener score de ejercicio completado
  const getExerciseScore = (exerciseId) => {
    const completed = currentUser?.verification_exercises_completed?.find(
      ex => ex.exercise_id === exerciseId
    );
    return completed?.score || 0;
  };

  // Calcular nivel de verificación total
  const getVerificationLevel = () => {
    const completed = currentUser?.verification_exercises_completed?.length || 0;
    const total = exercises.length;
    return Math.round((completed / total) * 100);
  };

  // Iniciar ejercicio
  const handleStartExercise = (exercise) => {
    setSelectedExercise(exercise);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowResults(false);
    setScore(0);
  };

  // Responder pregunta
  const handleAnswer = (answer) => {
    const newAnswers = [...userAnswers, answer];
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < selectedExercise.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calcular resultados
      calculateResults(newAnswers);
    }
  };

  // Calcular resultados
  const calculateResults = async (answers) => {
    const correct = answers.filter((answer, index) => 
      answer === selectedExercise.questions[index].correct_answer
    ).length;
    
    const totalQuestions = selectedExercise.questions.length;
    const percentage = Math.round((correct / totalQuestions) * 100);
    
    setScore(percentage);
    setShowResults(true);

    // Si pasó el ejercicio, actualizar usuario
    if (percentage >= selectedExercise.passing_score) {
      try {
        const completedExercises = currentUser.verification_exercises_completed || [];
        const exerciseAlreadyCompleted = completedExercises.some(
          ex => ex.exercise_id === selectedExercise.id
        );

        if (!exerciseAlreadyCompleted) {
          const updatedExercises = [
            ...completedExercises,
            {
              exercise_id: selectedExercise.id,
              completed_date: new Date().toISOString(),
              score: percentage
            }
          ];

          const newLevel = Math.round((updatedExercises.length / exercises.length) * 100);
          
          await base44.auth.updateMe({
            verification_exercises_completed: updatedExercises,
            verification_level: newLevel,
            is_verified: newLevel >= 100
          });

          // Actualizar custom_role si completa todos los ejercicios
          if (newLevel >= 100) {
            await base44.entities.User.update(currentUser.id, {
              custom_role: 'verified_user'
            });
            toast.success("🎉 ¡Felicidades! Ahora eres un Usuario Verificado");
          } else {
            toast.success("✅ ¡Ejercicio completado exitosamente!");
          }

          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
          
          // Recargar usuario
          const updatedUser = await base44.auth.me();
          setCurrentUser(updatedUser);
        }
      } catch (error) {
        console.error('Error actualizando verificación:', error);
        toast.error("Error guardando progreso");
      }
    }
  };

  // Reintentar ejercicio
  const handleRetry = () => {
    setSelectedExercise(null);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowResults(false);
    setScore(0);
  };

  const currentQuestion = selectedExercise?.questions[currentQuestionIndex];
  const verificationLevel = getVerificationLevel();

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-blue-500" />
            <h1 className="text-4xl font-bold text-white">Verificación de Usuario</h1>
          </div>
          <p className="text-gray-400 mb-6">
            Completa los ejercicios bíblicos para convertirte en Usuario Verificado
          </p>
          
          {/* Nivel de verificación */}
          <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <div className="text-left">
                  <p className="text-white font-semibold text-lg">Nivel de Verificación</p>
                  <p className="text-gray-300 text-sm">
                    {currentUser.verification_exercises_completed?.length || 0} de {exercises.length} ejercicios completados
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{verificationLevel}%</p>
                {currentUser.is_verified && (
                  <Badge className="bg-green-500/20 text-green-300 mt-2">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={verificationLevel} className="h-3" />
          </Card>
        </motion.div>

        {/* Vista de ejercicios o vista de quiz */}
        {!selectedExercise ? (
          <div className="space-y-6">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-white/5 rounded-lg animate-pulse" />
              ))
            ) : exercises.length > 0 ? (
              exercises.map((exercise, index) => {
                const isCompleted = hasCompletedExercise(exercise.id);
                const exerciseScore = getExerciseScore(exercise.id);
                const isLocked = index > 0 && !hasCompletedExercise(exercises[index - 1]?.id);

                return (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`p-6 ${
                      isLocked ? 'bg-white/5 border-white/10 opacity-50' :
                      isCompleted ? 'bg-green-500/10 border-green-500/30' :
                      'bg-white/5 border-white/10 hover:bg-white/10'
                    } transition-all`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              isCompleted ? 'bg-green-500/20' :
                              isLocked ? 'bg-gray-500/20' :
                              'bg-blue-500/20'
                            }`}>
                              {isCompleted ? (
                                <CheckCircle2 className="w-6 h-6 text-green-400" />
                              ) : isLocked ? (
                                <Lock className="w-6 h-6 text-gray-400" />
                              ) : (
                                <BookOpen className="w-6 h-6 text-blue-400" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">{exercise.title}</h3>
                              <p className="text-gray-400 text-sm">{exercise.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <Badge className="bg-purple-500/20 text-purple-300">
                              {exercise.difficulty === 'beginner' ? '🟢 Básico' :
                               exercise.difficulty === 'intermediate' ? '🟡 Intermedio' :
                               '🔴 Avanzado'}
                            </Badge>
                            <span className="text-gray-400">
                              {exercise.questions.length} preguntas
                            </span>
                            <span className="text-gray-400">
                              Mínimo: {exercise.passing_score}%
                            </span>
                            <span className="text-yellow-400">
                              <Star className="w-4 h-4 inline mr-1" />
                              {exercise.points_reward} puntos
                            </span>
                          </div>

                          {isCompleted && (
                            <div className="mt-3 flex items-center gap-2">
                              <Badge className="bg-green-500/20 text-green-300">
                                ✅ Completado
                              </Badge>
                              <span className="text-green-400 font-semibold">
                                Score: {exerciseScore}%
                              </span>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => handleStartExercise(exercise)}
                          disabled={isLocked}
                          className={`${
                            isLocked ? 'bg-gray-600' :
                            isCompleted ? 'bg-green-600 hover:bg-green-700' :
                            'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {isLocked ? (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              Bloqueado
                            </>
                          ) : isCompleted ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Reintentar
                            </>
                          ) : (
                            <>
                              <Target className="w-4 h-4 mr-2" />
                              Comenzar
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <Card className="bg-white/5 border-white/10 p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-xl text-gray-400">No hay ejercicios disponibles</p>
              </Card>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="bg-white/5 border-white/10 p-8">
                  {/* Progress */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">
                        Pregunta {currentQuestionIndex + 1} de {selectedExercise.questions.length}
                      </span>
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedExercise(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        Cancelar
                      </Button>
                    </div>
                    <Progress 
                      value={((currentQuestionIndex + 1) / selectedExercise.questions.length) * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Question */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {currentQuestion.question}
                    </h2>
                    {currentQuestion.verse_reference && (
                      <p className="text-blue-400 text-sm">
                        📖 {currentQuestion.verse_reference}
                      </p>
                    )}
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <Button
                        key={index}
                        onClick={() => handleAnswer(option)}
                        className="w-full justify-start text-left h-auto py-4 px-6 bg-white/10 hover:bg-blue-600 transition-all"
                      >
                        <span className="text-lg">{option}</span>
                      </Button>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className={`p-8 text-center ${
                  score >= selectedExercise.passing_score
                    ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30'
                    : 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30'
                }`}>
                  {score >= selectedExercise.passing_score ? (
                    <>
                      <CheckCircle2 className="w-24 h-24 text-green-400 mx-auto mb-6" />
                      <h2 className="text-4xl font-bold text-white mb-4">
                        ¡Aprobado! 🎉
                      </h2>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-24 h-24 text-red-400 mx-auto mb-6" />
                      <h2 className="text-4xl font-bold text-white mb-4">
                        No aprobaste 😔
                      </h2>
                    </>
                  )}

                  <div className="mb-6">
                    <p className="text-6xl font-bold text-white mb-2">{score}%</p>
                    <p className="text-gray-400">
                      {userAnswers.filter((answer, index) => 
                        answer === selectedExercise.questions[index].correct_answer
                      ).length} de {selectedExercise.questions.length} correctas
                    </p>
                    <p className="text-gray-400 mt-2">
                      Necesitas {selectedExercise.passing_score}% para aprobar
                    </p>
                  </div>

                  {score >= selectedExercise.passing_score && (
                    <Badge className="bg-yellow-500/20 text-yellow-300 mb-6 text-lg py-2 px-4">
                      <Award className="w-5 h-5 mr-2" />
                      +{selectedExercise.points_reward} puntos ganados
                    </Badge>
                  )}

                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={() => setSelectedExercise(null)}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Ver Ejercicios
                    </Button>
                    {score < selectedExercise.passing_score && (
                      <Button
                        onClick={handleRetry}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Reintentar
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}