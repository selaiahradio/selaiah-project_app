import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Shield,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Check,
  AlertCircle,
  Users,
  Lock,
  Settings as SettingsIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function AdminRolesPage() {
  const [editingRole, setEditingRole] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list('-level'),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const initializeRolesMutation = useMutation({
    mutationFn: async () => {
      const defaultRoles = [
        {
          name: "Super Admin",
          slug: "super_admin",
          level: 100,
          description: "Full access to ALL resources and actions",
          permissions: ["*"],
          is_system: true,
          is_active: true,
          color: "#ef4444",
          icon: "Shield"
        },
        {
          name: "Administrator",
          slug: "administrator",
          level: 80,
          description: "General administrative access",
          permissions: ["manage_users", "manage_content", "manage_settings", "view_analytics"],
          is_system: true,
          is_active: true,
          color: "#f59e0b",
          icon: "Settings"
        },
        {
          name: "Operations Manager",
          slug: "operations_manager",
          level: 70,
          description: "Daily operations management",
          permissions: ["manage_content", "manage_events", "manage_shows", "view_analytics"],
          is_system: false,
          is_active: true,
          color: "#10b981",
          icon: "Briefcase"
        },
        {
          name: "Support Manager",
          slug: "support_manager",
          level: 60,
          description: "Customer support and tickets",
          permissions: ["manage_contacts", "manage_comments", "view_users"],
          is_system: false,
          is_active: true,
          color: "#3b82f6",
          icon: "MessageSquare"
        },
        {
          name: "Content Moderator",
          slug: "content_moderator",
          level: 40,
          description: "Review content and moderate posts",
          permissions: ["moderate_posts", "moderate_comments", "manage_blog"],
          is_system: false,
          is_active: true,
          color: "#8b5cf6",
          icon: "FileCheck"
        }
      ];

      for (const role of defaultRoles) {
        await base44.entities.Role.create(role);
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setInitialized(true);
      toast.success("Roles inicializados correctamente");
    },
    onError: () => {
      toast.error("Error al inicializar roles");
    }
  });

  const createRoleMutation = useMutation({
    mutationFn: (data) => base44.entities.Role.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success("Rol creado exitosamente");
      setShowForm(false);
      setEditingRole(null);
    },
    onError: () => {
      toast.error("Error al crear el rol");
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Role.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success("Rol actualizado exitosamente");
      setShowForm(false);
      setEditingRole(null);
    },
    onError: () => {
      toast.error("Error al actualizar el rol");
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => base44.entities.Role.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success("Rol eliminado");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const permissionsText = formData.get('permissions');
    const permissions = permissionsText
      .split('\n')
      .map(p => p.trim())
      .filter(p => p);

    const data = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      level: parseInt(formData.get('level')),
      description: formData.get('description'),
      permissions,
      color: formData.get('color'),
      icon: formData.get('icon'),
      is_active: true,
      is_system: false
    };

    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const handleDelete = (role) => {
    if (role.is_system) {
      toast.error("No se puede eliminar un rol del sistema");
      return;
    }
    if (confirm(`¿Estás seguro de eliminar el rol "${role.name}"?`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const getLevelBadge = (level) => {
    if (level >= 80) return { color: "bg-red-500/20 text-red-300 border-red-500/30", label: "SUPER" };
    if (level >= 60) return { color: "bg-orange-500/20 text-orange-300 border-orange-500/30", label: "HIGH" };
    if (level >= 40) return { color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", label: "MEDIUM" };
    return { color: "bg-blue-500/20 text-blue-300 border-blue-500/30", label: "LOW" };
  };

  const getUsersWithRole = (roleSlug) => {
    return users.filter(u => u.role === roleSlug).length;
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
                <Shield className="w-10 h-10 text-[#006cf0]" />
                Roles & Permisos
              </h1>
              <p className="text-gray-400">
                Gestión de roles del sistema (RBAC)
              </p>
            </div>
            <div className="flex gap-2">
              {roles.length === 0 && !initialized && (
                <Button
                  onClick={() => initializeRolesMutation.mutate()}
                  disabled={initializeRolesMutation.isPending}
                  className="bg-gradient-to-r from-green-500 to-emerald-600"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Inicializar Roles
                </Button>
              )}
              <Button
                onClick={() => {
                  setEditingRole(null);
                  setShowForm(true);
                }}
                className="bg-gradient-to-r from-[#006cf0] to-[#00479e]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Rol
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-blue-300 mb-2">Acerca del Sistema RBAC</h3>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• <strong>Super Admin (Nivel 100):</strong> Acceso total a TODOS los recursos</li>
                <li>• <strong>Administrator (Nivel 80):</strong> Acceso administrativo general</li>
                <li>• <strong>Operations Manager (Nivel 70):</strong> Gestión de operaciones diarias</li>
                <li>• <strong>Support Manager (Nivel 60):</strong> Soporte y atención al usuario</li>
                <li>• <strong>Content Moderator (Nivel 40):</strong> Revisión de contenido</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card className="bg-white/5 border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {editingRole ? "Editar Rol" : "Nuevo Rol"}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowForm(false);
                      setEditingRole(null);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">Nombre del Rol *</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={editingRole?.name}
                        placeholder="Ej: Content Manager"
                        className="bg-white/10 border-white/20 text-white"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slug" className="text-white">Slug *</Label>
                      <Input
                        id="slug"
                        name="slug"
                        defaultValue={editingRole?.slug}
                        placeholder="content_manager"
                        className="bg-white/10 border-white/20 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="level" className="text-white">Nivel de Acceso (0-100) *</Label>
                      <Input
                        id="level"
                        name="level"
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={editingRole?.level || 30}
                        className="bg-white/10 border-white/20 text-white"
                        required
                      />
                      <p className="text-xs text-gray-400">100 = Super Admin, 0 = Sin acceso</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color" className="text-white">Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color"
                          name="color"
                          type="color"
                          defaultValue={editingRole?.color || "#3b82f6"}
                          className="w-20 h-10 p-1 bg-white/10 border-white/20"
                        />
                        <Input
                          defaultValue={editingRole?.color || "#3b82f6"}
                          className="flex-1 bg-white/10 border-white/20 text-white"
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="icon" className="text-white">Icono</Label>
                      <Input
                        id="icon"
                        name="icon"
                        defaultValue={editingRole?.icon || "User"}
                        placeholder="Shield, User, Settings"
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <p className="text-xs text-gray-400">Nombre de icono Lucide</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">Descripción</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editingRole?.description}
                      placeholder="Descripción del rol y sus responsabilidades"
                      className="bg-white/10 border-white/20 text-white"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="permissions" className="text-white">Permisos (uno por línea)</Label>
                    <Textarea
                      id="permissions"
                      name="permissions"
                      defaultValue={editingRole?.permissions?.join('\n') || ''}
                      placeholder="manage_users&#10;manage_content&#10;view_analytics"
                      className="bg-white/10 border-white/20 text-white font-mono text-sm"
                      rows={8}
                    />
                    <p className="text-xs text-gray-400">
                      Permisos disponibles: manage_users, manage_content, manage_settings, view_analytics, 
                      moderate_posts, manage_blog, manage_events, etc.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                      className="bg-gradient-to-r from-[#006cf0] to-[#00479e]"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingRole ? "Actualizar" : "Crear"} Rol
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingRole(null);
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
        </AnimatePresence>

        {/* Roles List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : roles.length > 0 ? (
            roles.map((role) => {
              const levelBadge = getLevelBadge(role.level);
              const usersCount = getUsersWithRole(role.slug);

              return (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="bg-white/5 border-white/10 p-6 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: role.color + '40' }}
                        >
                          <Shield className="w-6 h-6" style={{ color: role.color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${levelBadge.color} text-xs px-2 py-0.5`}>
                              Level {role.level}
                            </Badge>
                            <Badge className={levelBadge.color}>
                              {levelBadge.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {role.is_system && (
                        <Badge className="bg-gray-500/20 text-gray-300 text-xs">
                          <Lock className="w-3 h-3 mr-1" />
                          Sistema
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{role.name}</h3>
                    
                    <p className="text-gray-400 text-sm mb-4 flex-1">
                      {role.description}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Usuarios:
                        </span>
                        <span className="text-white font-semibold">{usersCount}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Permisos:</span>
                        <span className="text-white font-semibold">
                          {role.permissions?.length || 0}
                        </span>
                      </div>

                      <details className="text-sm">
                        <summary className="text-gray-400 cursor-pointer hover:text-white transition">
                          Ver permisos
                        </summary>
                        <ul className="mt-2 space-y-1 pl-4">
                          {role.permissions?.map((perm, i) => (
                            <li key={i} className="text-gray-300 text-xs flex items-center gap-2">
                              <Check className="w-3 h-3 text-green-400" />
                              {perm}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingRole(role);
                          setShowForm(true);
                        }}
                        className="flex-1 bg-[#006cf0] hover:bg-[#00479e]"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      {!role.is_system && (
                        <Button
                          size="sm"
                          onClick={() => handleDelete(role)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full">
              <Card className="bg-white/5 border-white/10 p-12 text-center">
                <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-xl text-gray-400 mb-4">No hay roles configurados</p>
                <Button
                  onClick={() => initializeRolesMutation.mutate()}
                  disabled={initializeRolesMutation.isPending}
                  className="bg-gradient-to-r from-green-500 to-emerald-600"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Inicializar Roles del Sistema
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}