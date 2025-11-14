import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UserCheck, Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminVerificationsPage() {
  const [editingExercise, setEditingExercise] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [questions, setQuestions] = useState([]);
  const queryClient = useQueryClient();

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['adminVerificationExercises'],
    queryFn: () => base44.entities.VerificationExercise.list("order"),
    initialData: [],
  });

  const createExerciseMutation = useMutation({
    mutationFn: (data) => base44.entities.VerificationExercise.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminVerificationExercises'] });
      toast.success("Ejercicio creado");
      setShowForm(false);
      setEditingExercise(null);
      setQuestions([]);
    },
  });

  const updateExerciseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VerificationExercise.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminVerificationExercises'] });
      toast.success("Ejercicio actualizado");
      setShowForm(false);
      setEditingExercise(null);
      setQuestions([]);
    },
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: (id) => base44.entities.VerificationExercise.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminVerificationExercises'] });
      toast.success("Ejercicio eliminado");
    },
  });

  const addQuestion = () => {
    setQuestions([...questions, {
      question: "",
      options: ["", "", "", ""],
      correct_answer: "",
      explanation: "",
      verse_reference: ""
    }]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      type: formData.get('type'),
      difficulty: formData.get('difficulty'),
      category: formData.get('category'),
      passing_score: parseInt(formData.get('passing_score')),
      points_reward: parseInt(formData.get('points_reward')),
      order: parseInt(formData.get('order')),
      is_active: formData.get('is_active') === 'on',
      questions: questions
    };

    if (editingExercise) {
      updateExerciseMutation.mutate({ id: editingExercise.id, data });
    } else {
      createExerciseMutation.mutate(data);
    }
  };

  const handleEdit = (exercise) => {
    setEditingExercise(exercise);
    setQuestions(exercise.questions || []);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to={createPageUrl("Admin")}>
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Panel
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <UserCheck className="w-10 h-10 text-[#006cf0]" />
                Ejercicios de Verificación
              </h1>
              <p className="text-gray-400">
                Pruebas religiosas para verificar usuarios
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingExercise(null);
                setQuestions([]);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Ejercicio
            </Button>
          </div>
        </motion.div>

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-white/5 border-white/10 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingExercise ? "Editar Ejercicio" : "Nuevo Ejercicio"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">Título *</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editingExercise?.title}
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Descripción</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingExercise?.description}
                    className="bg-white/10 border-white/20 text-white"
                    rows={2}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-white">Tipo *</Label>
                    <Select name="type" defaultValue={editingExercise?.type || "bible_quiz"}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bible_quiz">Quiz Bíblico</SelectItem>
                        <SelectItem value="doctrine_test">Test de Doctrina</SelectItem>
                        <SelectItem value="testimony">Testimonio</SelectItem>
                        <SelectItem value="scripture_memorization">Memorización</SelectItem>
                        <SelectItem value="prayer_practice">Práctica de Oración</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-white">Dificultad</Label>
                    <Select name="difficulty" defaultValue={editingExercise?.difficulty || "beginner"}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Principiante</SelectItem>
                        <SelectItem value="intermediate">Intermedio</SelectItem>
                        <SelectItem value="advanced">Avanzado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-white">Categoría</Label>
                    <Select name="category" defaultValue={editingExercise?.category || "doctrine"}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="doctrine">Doctrina</SelectItem>
                        <SelectItem value="bible_knowledge">Conocimiento Bíblico</SelectItem>
                        <SelectItem value="pentecostal_practice">Práctica Pentecostal</SelectItem>
                        <SelectItem value="worship">Adoración</SelectItem>
                        <SelectItem value="ministry">Ministerio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="passing_score" className="text-white">Puntaje Mínimo (%)</Label>
                    <Input
                      id="passing_score"
                      name="passing_score"
                      type="number"
                      defaultValue={editingExercise?.passing_score || 70}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="points_reward" className="text-white">Puntos de Recompensa</Label>
                    <Input
                      id="points_reward"
                      name="points_reward"
                      type="number"
                      defaultValue={editingExercise?.points_reward || 10}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="order" className="text-white">Orden</Label>
                    <Input
                      id="order"
                      name="order"
                      type="number"
                      defaultValue={editingExercise?.order || 0}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                {/* Questions */}
                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Preguntas</h3>
                    <Button type="button" onClick={addQuestion} size="sm" className="bg-blue-600">
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar Pregunta
                    </Button>
                  </div>

                  {questions.map((q, qIndex) => (
                    <Card key={qIndex} className="bg-white/10 border-white/20 p-4 mb-4">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <Label className="text-white">Pregunta {qIndex + 1}</Label>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => removeQuestion(qIndex)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <Input
                          placeholder="Pregunta"
                          value={q.question}
                          onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                        />

                        <div className="grid md:grid-cols-2 gap-2">
                          {q.options.map((opt, oIndex) => (
                            <Input
                              key={oIndex}
                              placeholder={`Opción ${oIndex + 1}`}
                              value={opt}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              className="bg-white/10 border-white/20 text-white"
                            />
                          ))}
                        </div>

                        <Input
                          placeholder="Respuesta correcta"
                          value={q.correct_answer}
                          onChange={(e) => updateQuestion(qIndex, 'correct_answer', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                        />

                        <Textarea
                          placeholder="Explicación"
                          value={q.explanation}
                          onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          rows={2}
                        />

                        <Input
                          placeholder="Referencia bíblica (ej: Juan 3:16)"
                          value={q.verse_reference}
                          onChange={(e) => updateQuestion(qIndex, 'verse_reference', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    id="is_active"
                    name="is_active"
                    defaultChecked={editingExercise?.is_active ?? true}
                  />
                  <Label htmlFor="is_active" className="text-white cursor-pointer">
                    Ejercicio Activo
                  </Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createExerciseMutation.isPending || updateExerciseMutation.isPending || questions.length === 0}
                    className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingExercise(null);
                      setQuestions([]);
                    }}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Exercises List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : exercises.length > 0 ? (
            exercises.map((exercise) => (
              <Card key={exercise.id} className="bg-white/5 border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{exercise.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        exercise.is_active ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {exercise.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300">
                        {exercise.difficulty}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{exercise.description}</p>
                    <div className="flex gap-4 text-sm text-gray-300">
                      <span>📝 {exercise.questions?.length || 0} preguntas</span>
                      <span>✨ +{exercise.points_reward} puntos</span>
                      <span>🎯 {exercise.passing_score}% mínimo</span>
                      <span>📚 {exercise.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(exercise)}
                      className="bg-[#006cf0] hover:bg-[#00479e] text-white"
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (confirm("¿Eliminar este ejercicio?")) {
                          deleteExerciseMutation.mutate(exercise.id);
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="bg-white/5 border-white/10 p-12 text-center">
              <UserCheck className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400 mb-4">No hay ejercicios</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Ejercicio
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}