
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, ArrowLeft, Search, Shield, ShieldCheck, Edit, Crown, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { appParams } from "@/lib/app-params";

// --- START: NEW API LOGIC ---
const API_BASE_URL = "https://us-central1-selaiah-radio.cloudfunctions.net/api";
const token = appParams.token;

const fetcher = async (path, options = {}) => {
    const url = `${API_BASE_URL}${path}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error on ${path}: ${errorText}`);
        throw new Error(`Request failed: ${response.status}`);
    }
    if (response.status === 204) return null;
    return response.json();
};

const getMe = () => fetcher('/users/me');
const getUsers = () => fetcher('/users?sort=-created_date');
const updateUser = ({ id, data }) => fetcher(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
// --- END: NEW API LOGIC ---

const ROLES = [
  { value: 'user', label: 'Usuario', icon: <Shield className="w-4 h-4" /> },
  { value: 'verified_user', label: 'Usuario Verificado', icon: <ShieldAlert className="w-4 h-4" /> },
  { value: 'admin', label: 'Administrador', icon: <ShieldCheck className="w-4 h-4" /> },
  { value: 'superadmin', label: 'Superadmin', icon: <Crown className="w-4 h-4" /> },
];

const getRoleInfo = (role) => {
  const roleMap = {
    superadmin: { className: "bg-red-500/20 text-red-300 border-red-500", icon: <Crown className="w-3 h-3" />, label: "Superadmin" },
    admin: { className: "bg-purple-500/20 text-purple-300 border-purple-500", icon: <ShieldCheck className="w-3 h-3" />, label: "Admin" },
    verified_user: { className: "bg-green-500/20 text-green-300 border-green-500", icon: <ShieldAlert className="w-3 h-3" />, label: "Verificado" },
    user: { className: "bg-gray-500/20 text-gray-300 border-gray-500", icon: <Shield className="w-3 h-3" />, label: "Usuario" },
  };
  return roleMap[role] || roleMap.user;
};


export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser, isError: isAuthError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getMe,
    retry: 1,
  });

  const isAppCreator = currentUser?.email === 'joltcab@gmail.com';
  const isAuthorized = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || isAppCreator);

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: isAuthorized, // Only fetch if authorized
  });

  const updateUserMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Rol de usuario actualizado exitosamente");
      setShowEditDialog(false);
      setEditingUser(null);
    },
    onError: (error) => {
      toast.error(`Error al actualizar el rol: ${error.message}`);
    }
  });

  React.useEffect(() => {
    if (isAuthError) {
      toast.error("Acceso denegado. Debes iniciar sesión como administrador.");
      // Redirect or show login
    }
  }, [isAuthError]);

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      custom_role: user.custom_role || user.role || 'user'
    });
    setShowEditDialog(true);
  };

  const handleSaveUser = () => {
    if (!editingUser) return;
    const newRole = editingUser.custom_role || editingUser.role;
    const data = {
        custom_role: newRole,
        ...(newRole === 'admin' || newRole === 'superadmin' ? { role: 'admin' } : { role: 'user' })
    };
    updateUserMutation.mutate({ id: editingUser.id, data });
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAuthorized) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <Card className="bg-white/5 border-red-500/30 p-8 max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
          <p className="text-gray-400 mb-4">No tienes permisos para gestionar usuarios.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to={createPageUrl("Admin")}>
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Panel</Button>
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3"><Users className="w-10 h-10 text-[#006cf0]" />Gestión de Usuarios</h1>
              <p className="text-gray-400">Administra usuarios y sus roles en el sistema</p>
            </div>
          </div>
        </motion.div>

        <Card className="bg-white/5 border-white/10 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input type="text" placeholder="Buscar por nombre o email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white/10 border-white/20 text-white" />
          </div>
        </Card>

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
                {isLoadingUsers ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-white/5 animate-pulse"><td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-full"></div></td><td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-full"></div></td><td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-full"></div></td><td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-full"></div></td><td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-full"></div></td></tr>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const displayRole = user.custom_role || user.role || 'user';
                    const roleInfo = getRoleInfo(displayRole);
                    return (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <th scope="row" className="flex items-center px-6 py-4 text-white whitespace-nowrap">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-md flex-shrink-0 mr-3">{user.full_name?.[0]?.toUpperCase() || 'U'}</div>
                          <div>
                            <div className="font-semibold text-base flex items-center gap-2">{user.full_name || 'Usuario sin nombre'}{user.email === 'joltcab@gmail.com' && (<Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500">👑 Creador</Badge>)}</div>
                            <div className="text-gray-500">{user.email}</div>
                          </div>
                        </th>
                        <td className="px-6 py-4"><Badge className={roleInfo.className}>{roleInfo.icon}{roleInfo.label}</Badge></td>
                        <td className="px-6 py-4">{user.is_verified ? <Badge variant="outline" className="text-green-400 border-green-500/50 bg-green-500/10"><ShieldCheck className="w-3 h-3 mr-1" /> Verificado</Badge> : <Badge variant="outline" className="text-gray-500 border-gray-500/50 bg-gray-500/10"><Shield className="w-3 h-3 mr-1" /> No verificado</Badge>}</td>
                        <td className="px-6 py-4">{new Date(user.created_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">{user.id !== currentUser?.id && isAuthorized && (<Button size="sm" onClick={() => handleEditUser(user)} className="bg-[#006cf0] hover:bg-[#00479e] text-white"><Edit className="w-4 h-4" /></Button>)}{user.id === currentUser?.id && (<span className="text-xs text-gray-500 px-3 py-2">Tu cuenta</span>)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="5" className="px-6 py-12 text-center"><Users className="w-16 h-16 text-gray-600 mx-auto mb-4" /><p className="text-xl text-gray-400">No se encontraron usuarios</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-slate-900 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Editar Usuario</DialogTitle>
              <DialogDescription className="text-gray-400">Modifica el rol del usuario {editingUser?.full_name}</DialogDescription>
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
                  <Select value={editingUser.custom_role || editingUser.role || 'user'} onValueChange={(value) => setEditingUser({ ...editingUser, custom_role: value })}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map(role => (<SelectItem key={role.value} value={role.value}><div className="flex items-center gap-2">{role.icon}{role.label}</div></SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3"><p className="text-xs text-yellow-200">⚠️ Cambiar el rol de un usuario afecta sus permisos en todo el sistema.</p></div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-white/20 text-white hover:bg-white/10">Cancelar</Button>
              <Button onClick={handleSaveUser} disabled={updateUserMutation.isPending} className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white">{updateUserMutation.isPending ? "Guardando..." : "Guardar Cambios"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
