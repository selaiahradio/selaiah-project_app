
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users,
  ArrowLeft,
  Search,
  Shield,
  ShieldCheck,
  Edit,
  Crown,
  ShieldAlert
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const queryClient = useQueryClient();

  // Roles for the Select dropdown
  const roles = [
    { value: 'user', label: 'Usuario', icon: <Shield className="w-4 h-4" /> },
    { value: 'verified_user', label: 'Usuario Verificado', icon: <ShieldAlert className="w-4 h-4" /> },
    { value: 'admin', label: 'Administrador', icon: <ShieldCheck className="w-4 h-4" /> },
    { value: 'superadmin', label: 'Superadmin', icon: <Crown className="w-4 h-4" /> },
  ];

  // Helper to get role display info for badges
  const getRoleInfo = (role) => {
    const roleMap = {
      superadmin: { className: "bg-red-500/20 text-red-300 border-red-500", icon: <Crown className="w-3 h-3" />, label: "Superadmin" },
      admin: { className: "bg-purple-500/20 text-purple-300 border-purple-500", icon: <ShieldCheck className="w-3 h-3" />, label: "Admin" },
      verified_user: { className: "bg-green-500/20 text-green-300 border-green-500", icon: <ShieldAlert className="w-3 h-3" />, label: "Verificado" },
      user: { className: "bg-gray-500/20 text-gray-300 border-gray-500", icon: <Shield className="w-3 h-3" />, label: "Usuario" },
    };
    return roleMap[role] || roleMap.user; // Default to user if role is not found
  };


  // Obtener usuario actual Y VERIFICAR PERMISOS
  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        // PROTECCIÓN: Solo admin, superadmin o creador pueden acceder
        const isAppCreator = user.email === 'joltcab@gmail.com';
        if (user.role === 'admin' || user.role === 'superadmin' || isAppCreator) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          toast.error("Acceso denegado. Solo administradores pueden gestionar usuarios.");
          setTimeout(() => {
            window.location.href = createPageUrl("Home");
          }, 2000);
        }
      } catch (error) {
        setCurrentUser(null);
        setIsAuthorized(false);
        toast.error("Debes iniciar sesión como administrador");
        setTimeout(() => {
          base44.auth.redirectToLogin(window.location.pathname);
        }, 2000);
      }
    };
    fetchUser();
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list("-created_date"),
    initialData: [],
    enabled: isAuthorized, // Only fetch users if authorized
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, newRole }) => {
      console.log('🔄 Actualizando usuario:', userId, 'con custom_role:', newRole);
      
      // Actualizar directamente con custom_role
      const updatedUser = await base44.entities.User.update(userId, {
        custom_role: newRole,
        // Si es admin o superadmin, también actualizar el role nativo
        ...(newRole === 'admin' || newRole === 'superadmin' ? { role: 'admin' } : { role: 'user' })
      });
      
      console.log('✅ Usuario actualizado:', updatedUser);
      return updatedUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("✅ Rol actualizado exitosamente");
      setShowEditDialog(false);
      setEditingUser(null);
    },
    onError: (error) => {
      console.error('💥 Error completo:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Error desconocido';
      toast.error("❌ Error: " + errorMsg);
    }
  });

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      custom_role: user.custom_role || user.role || 'user' // Initialize custom_role for editing
    });
    setShowEditDialog(true);
  };

  const handleSaveUser = () => {
    if (!editingUser) return;

    console.log('📤 Guardando cambios:', {
      userId: editingUser.id,
      newRole: editingUser.custom_role || editingUser.role // Use custom_role if present, else native role
    });

    updateUserMutation.mutate({
      userId: editingUser.id,
      newRole: editingUser.custom_role || editingUser.role
    });
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const isCurrentUserSuperadmin = currentUser?.role === 'superadmin';
  const isAppCreator = currentUser?.email === 'joltcab@gmail.com';
  const canManageUsers = isCurrentUserSuperadmin || isAppCreator || currentUser?.role === 'admin';

  // Si no está autorizado, mostrar mensaje
  if (!isAuthorized) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <Card className="bg-white/5 border-red-500/30 p-8 max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
            <p className="text-gray-400 mb-4">
              Solo administradores pueden gestionar usuarios del sistema.
            </p>
            <Badge className="bg-red-500/20 text-red-300">
              {currentUser?.role ? `Tu rol: ${currentUser.role}` : 'No autenticado'}
            </Badge>
          </Card>
        </div>
      </div>
    );
  }

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
                <Users className="w-10 h-10 text-[#006cf0]" />
                Gestión de Usuarios
              </h1>
              <p className="text-gray-400">
                Administra usuarios y sus roles en el sistema
              </p>
            </div>
          </div>

          {/* Mensaje de éxito si tienes permisos */}
          {canManageUsers && (
            <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 p-4 mt-6">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-green-400" />
                <div>
                  <p className="font-semibold text-green-300">
                    ✅ Tienes permisos de administración
                  </p>
                  <p className="text-sm text-green-200">
                    Puedes gestionar todos los usuarios del sistema
                  </p>
                </div>
              </div>
            </Card>
          )}
        </motion.div>

        {/* Search Bar */}
        <Card className="bg-white/5 border-white/10 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white"
            />
          </div>
        </Card>

        {/* Users Table */}
        <Card className="bg-white/5 border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs text-gray-300 uppercase bg-white/5">
                <tr className="border-b border-white/10">
                  <th scope="col" className="px-6 py-3">Usuario</th>
                  <th scope="col" className="px-6 py-3">Rol</th>
                  <th scope="col" className="px-6 py-3">Estado</th>
                  <th scope="col" className="px-6 py-3">Creado</th>
                  <th scope="col" className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-white/5 animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-700 rounded w-full"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-700 rounded w-full"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-700 rounded w-full"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-700 rounded w-full"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-700 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const displayRole = user.custom_role || user.role || 'user';
                    const roleInfo = getRoleInfo(displayRole);
                    
                    return (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <th scope="row" className="flex items-center px-6 py-4 text-white whitespace-nowrap">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-md flex-shrink-0 mr-3">
                            {user.full_name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-base flex items-center gap-2">
                              {user.full_name || 'Usuario sin nombre'}
                              {user.email === 'joltcab@gmail.com' && (
                                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500">
                                  👑 Creador
                                </Badge>
                              )}
                            </div>
                            <div className="text-gray-500">{user.email}</div>
                          </div>
                        </th>
                        <td className="px-6 py-4">
                          <Badge className={roleInfo.className}>
                            {roleInfo.icon}
                            {roleInfo.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {user.is_verified ? (
                            <Badge variant="outline" className="text-green-400 border-green-500/50 bg-green-500/10">
                              <ShieldCheck className="w-3 h-3 mr-1" /> Verificado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500 border-gray-500/50 bg-gray-500/10">
                              <Shield className="w-3 h-3 mr-1" /> No verificado
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {new Date(user.created_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {user.id !== currentUser?.id && canManageUsers && (
                            <Button
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="bg-[#006cf0] hover:bg-[#00479e] text-white"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {user.id === currentUser?.id && (
                            <span className="text-xs text-gray-500 px-3 py-2">
                              Tu cuenta
                            </span>
                          )}
                          {user.id !== currentUser?.id && !canManageUsers && (
                            <span className="text-xs text-gray-500 px-3 py-2">
                              Sin permisos
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-xl text-gray-400">No se encontraron usuarios</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-slate-900 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Editar Usuario</DialogTitle>
              <DialogDescription className="text-gray-400">
                Modifica el rol del usuario {editingUser?.full_name}
              </DialogDescription>
            </DialogHeader>

            {editingUser && (
              <div className="space-y-4 py-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Usuario</p>
                  <p className="text-white font-semibold">{editingUser.full_name}</p>
                  <p className="text-gray-500 text-sm">{editingUser.email}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Rol</Label>
                  <Select
                    value={editingUser.custom_role || editingUser.role || 'user'}
                    onValueChange={(value) => setEditingUser({ ...editingUser, custom_role: value })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center gap-2">
                            {role.icon}
                            {role.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-xs text-yellow-200">
                    ⚠️ Cambiar el rol de un usuario afecta sus permisos en todo el sistema.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveUser}
                disabled={updateUserMutation.isPending}
                className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
              >
                {updateUserMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
