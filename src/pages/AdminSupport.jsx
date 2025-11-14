import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  HeadphonesIcon,
  ArrowLeft,
  Plus,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Edit,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminSupportPage() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['supportTickets'],
    queryFn: () => base44.entities.SupportTicket.list('-created_date'),
    initialData: [],
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['supportDepartments'],
    queryFn: () => base44.entities.SupportDepartment.list('priority'),
    initialData: [],
  });

  const createDepartmentMutation = useMutation({
    mutationFn: (data) => base44.entities.SupportDepartment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportDepartments'] });
      toast.success("Departamento creado");
      setShowDepartmentForm(false);
      setEditingDepartment(null);
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupportDepartment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportDepartments'] });
      toast.success("Departamento actualizado");
      setShowDepartmentForm(false);
      setEditingDepartment(null);
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupportTicket.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      toast.success("Ticket actualizado");
    },
  });

  const handleSaveDepartment = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      icon: formData.get('icon'),
      color: formData.get('color'),
      ai_context: formData.get('ai_context'),
      auto_response_enabled: formData.get('auto_response_enabled') === 'on',
      is_active: true,
      priority: parseInt(formData.get('priority') || '0')
    };

    if (editingDepartment) {
      updateDepartmentMutation.mutate({ id: editingDepartment.id, data });
    } else {
      createDepartmentMutation.mutate(data);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      open: { color: 'bg-blue-500/20 text-blue-300', label: 'Abierto', icon: Clock },
      in_progress: { color: 'bg-yellow-500/20 text-yellow-300', label: 'En Proceso', icon: AlertCircle },
      resolved: { color: 'bg-green-500/20 text-green-300', label: 'Resuelto', icon: CheckCircle },
      closed: { color: 'bg-gray-500/20 text-gray-300', label: 'Cerrado', icon: CheckCircle }
    };
    const config = configs[status] || configs.open;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const configs = {
      urgent: { color: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'Urgente' },
      high: { color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', label: 'Alta' },
      medium: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', label: 'Media' },
      low: { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'Baja' }
    };
    const config = configs[priority] || configs.medium;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-7xl">
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
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <HeadphonesIcon className="w-10 h-10 text-[#006cf0]" />
                Sistema de Soporte
              </h1>
              <p className="text-gray-400">
                Gestiona tickets y departamentos de soporte con IA
              </p>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="tickets" className="data-[state=active]:bg-[#006cf0]">
              Tickets ({tickets.length})
            </TabsTrigger>
            <TabsTrigger value="departments" className="data-[state=active]:bg-[#006cf0]">
              Departamentos ({departments.length})
            </TabsTrigger>
          </TabsList>

          {/* Tickets */}
          <TabsContent value="tickets" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {tickets.filter(t => t.status === 'open').length}
                    </p>
                    <p className="text-sm text-gray-400">Abiertos</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-400" />
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {tickets.filter(t => t.status === 'in_progress').length}
                    </p>
                    <p className="text-sm text-gray-400">En Proceso</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-yellow-400" />
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {tickets.filter(t => t.status === 'resolved').length}
                    </p>
                    <p className="text-sm text-gray-400">Resueltos Hoy</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Lista de tickets */}
              <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto">
                {ticketsLoading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="h-24 bg-white/5 rounded-lg animate-pulse" />
                  ))
                ) : tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <Card
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`bg-white/5 border-white/10 p-4 cursor-pointer hover:bg-white/10 transition ${
                        selectedTicket?.id === ticket.id ? 'ring-2 ring-[#006cf0]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{ticket.subject}</p>
                          <p className="text-xs text-gray-400">{ticket.user_name}</p>
                        </div>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(ticket.priority)}
                        <Badge className="bg-purple-500/20 text-purple-300">
                          {ticket.department_name || 'Sin departamento'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {format(new Date(ticket.created_date), "d MMM, HH:mm", { locale: es })}
                      </p>
                    </Card>
                  ))
                ) : (
                  <Card className="bg-white/5 border-white/10 p-8 text-center">
                    <HeadphonesIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400">No hay tickets</p>
                  </Card>
                )}
              </div>

              {/* Detalle del ticket */}
              <div className="lg:col-span-2">
                {selectedTicket ? (
                  <Card className="bg-white/5 border-white/10 p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">{selectedTicket.subject}</h3>
                        <div className="flex items-center gap-2 mb-3">
                          {getStatusBadge(selectedTicket.status)}
                          {getPriorityBadge(selectedTicket.priority)}
                        </div>
                        <p className="text-sm text-gray-400">
                          De: {selectedTicket.user_name} ({selectedTicket.user_email})
                        </p>
                        <p className="text-sm text-gray-400">
                          {format(new Date(selectedTicket.created_date), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                        </p>
                      </div>
                    </div>

                    <div className="mb-6 p-4 bg-white/5 rounded-lg">
                      <p className="text-white whitespace-pre-wrap">{selectedTicket.description}</p>
                    </div>

                    {/* Mensajes */}
                    {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                      <div className="mb-6 space-y-3 max-h-96 overflow-y-auto">
                        <h4 className="font-semibold text-white mb-3">Conversación</h4>
                        {selectedTicket.messages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg ${
                              msg.is_ai ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {msg.is_ai && <Sparkles className="w-4 h-4 text-purple-400" />}
                              <span className="font-semibold text-white text-sm">{msg.sender_name}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm">{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="space-y-3">
                      <Label className="text-white">Cambiar Estado</Label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateTicketMutation.mutate({
                            id: selectedTicket.id,
                            data: { status: 'in_progress' }
                          })}
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          En Proceso
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateTicketMutation.mutate({
                            id: selectedTicket.id,
                            data: { status: 'resolved', resolved_at: new Date().toISOString() }
                          })}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Resolver
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateTicketMutation.mutate({
                            id: selectedTicket.id,
                            data: { status: 'closed' }
                          })}
                          className="bg-gray-600 hover:bg-gray-700"
                        >
                          Cerrar
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="bg-white/5 border-white/10 p-12 text-center">
                    <HeadphonesIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-xl text-gray-400">Selecciona un ticket para ver los detalles</p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Departamentos */}
          <TabsContent value="departments" className="space-y-6">
            <div className="flex justify-end mb-6">
              <Button
                onClick={() => {
                  setEditingDepartment(null);
                  setShowDepartmentForm(true);
                }}
                className="bg-gradient-to-r from-[#006cf0] to-[#00479e]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Departamento
              </Button>
            </div>

            {showDepartmentForm && (
              <Card className="bg-white/5 border-white/10 p-6 mb-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  {editingDepartment ? 'Editar' : 'Nuevo'} Departamento
                </h3>
                <form onSubmit={handleSaveDepartment} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Nombre *</Label>
                      <Input
                        name="name"
                        defaultValue={editingDepartment?.name}
                        className="bg-white/10 border-white/20 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Slug *</Label>
                      <Input
                        name="slug"
                        defaultValue={editingDepartment?.slug}
                        className="bg-white/10 border-white/20 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Icono (Lucide)</Label>
                      <Input
                        name="icon"
                        defaultValue={editingDepartment?.icon || 'HeadphonesIcon'}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Color</Label>
                      <Input
                        type="color"
                        name="color"
                        defaultValue={editingDepartment?.color || '#006cf0'}
                        className="bg-white/10 border-white/20 h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Prioridad</Label>
                      <Input
                        type="number"
                        name="priority"
                        defaultValue={editingDepartment?.priority || 0}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Descripción</Label>
                    <Textarea
                      name="description"
                      defaultValue={editingDepartment?.description}
                      className="bg-white/10 border-white/20 text-white"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Contexto para la IA</Label>
                    <Textarea
                      name="ai_context"
                      defaultValue={editingDepartment?.ai_context}
                      placeholder="Proporciona contexto específico que la IA debe conocer sobre este departamento..."
                      className="bg-white/10 border-white/20 text-white"
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="auto_response_enabled"
                      id="auto_response"
                      defaultChecked={editingDepartment?.auto_response_enabled !== false}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="auto_response" className="text-white cursor-pointer">
                      Habilitar respuesta automática con IA
                    </Label>
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" className="bg-[#006cf0] hover:bg-[#00479e]">
                      {editingDepartment ? 'Actualizar' : 'Crear'} Departamento
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowDepartmentForm(false);
                        setEditingDepartment(null);
                      }}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept) => (
                <Card key={dept.id} className="bg-white/5 border-white/10 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: dept.color + '40' }}
                      >
                        <HeadphonesIcon className="w-6 h-6" style={{ color: dept.color }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{dept.name}</h3>
                        <p className="text-xs text-gray-400">{dept.slug}</p>
                      </div>
                    </div>
                    {dept.auto_response_enabled && (
                      <Badge className="bg-purple-500/20 text-purple-300">
                        <Sparkles className="w-3 h-3 mr-1" />
                        IA
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-gray-400 mb-4">{dept.description}</p>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingDepartment(dept);
                        setShowDepartmentForm(true);
                      }}
                      className="flex-1 bg-[#006cf0] hover:bg-[#00479e]"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}