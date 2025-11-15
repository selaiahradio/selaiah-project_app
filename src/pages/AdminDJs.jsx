
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Mic2, Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const API_BASE_URL = "https://us-central1-selaiah-radio.cloudfunctions.net/api";

// --- START: New Data Fetching Functions ---

const fetchDJs = async () => {
  const response = await fetch(`${API_BASE_URL}/radio_jockeys?sort=-created_date`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Error ${response.status}: ${errorData.message || 'Failed to fetch DJs'}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

const createDJ = async (newDJ) => {
  const response = await fetch(`${API_BASE_URL}/radio_jockeys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newDJ),
  });
  if (!response.ok) {
    throw new Error('Failed to create DJ');
  }
  return response.json();
};

const updateDJ = async ({ id, data }) => {
  const response = await fetch(`${API_BASE_URL}/radio_jockeys/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update DJ');
  }
  return response.json();
};

const deleteDJ = async (id) => {
  const response = await fetch(`${API_BASE_URL}/radio_jockeys/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete DJ');
  }
  // Return a success indicator, as delete might not return a body
  return { success: true };
};

// --- END: New Data Fetching Functions ---


export default function AdminDJsPage() {
  const [editingDJ, setEditingDJ] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  // MODIFIED: Using the new fetchDJs function
  const { data: djs, isLoading, isError, error } = useQuery({
    queryKey: ['adminDJs'],
    queryFn: fetchDJs,
    initialData: [],
  });
  
  if (isError) {
      console.error("Error fetching DJs:", error);
      toast.error(`Error al cargar DJs: ${error.message}`);
  }

  // MODIFIED: Using the new createDJ function
  const createDJMutation = useMutation({
    mutationFn: createDJ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDJs'] });
      toast.success("DJ creado exitosamente");
      setShowForm(false);
      setEditingDJ(null);
    },
    onError: (err) => toast.error(`Error al crear el DJ: ${err.message}`),
  });

  // MODIFIED: Using the new updateDJ function
  const updateDJMutation = useMutation({
    mutationFn: updateDJ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDJs'] });
      toast.success("DJ actualizado exitosamente");
      setShowForm(false);
      setEditingDJ(null);
    },
    onError: (err) => toast.error(`Error al actualizar el DJ: ${err.message}`),
  });

  // MODIFIED: Using the new deleteDJ function
  const deleteDJMutation = useMutation({
    mutationFn: deleteDJ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDJs'] });
      toast.success("DJ eliminado");
    },
    onError: (err) => toast.error(`Error al eliminar el DJ: ${err.message}`),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      bio: formData.get('bio') || null,
      photo_url: formData.get('photo_url') || null,
      role: formData.get('role') || null,
      social_links: {
        facebook: formData.get('facebook') || null,
        twitter: formData.get('twitter') || null,
        instagram: formData.get('instagram') || null,
        youtube: formData.get('youtube') || null,
      },
      is_featured: formData.get('is_featured') === 'on',
      status: formData.get('status'),
    };

    if (editingDJ) {
      updateDJMutation.mutate({ id: editingDJ.id, data });
    } else {
      createDJMutation.mutate(data);
    }
  };

  const handleEdit = (dj) => {
    setEditingDJ(dj);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de eliminar este DJ?")) {
      deleteDJMutation.mutate(id);
    }
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
                <Mic2 className="w-10 h-10 text-[#006cf0]" />
                Gestión de DJs y Locutores
              </h1>
              <p className="text-gray-400">
                Administra los perfiles de locutores cristianos
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingDJ(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-[#006cf0] to-[#0056c0] hover:from-[#0056c0] hover:to-[#0045a0] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo DJ
            </Button>
          </div>
        </motion.div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-white/5 border-white/10 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingDJ ? "Editar DJ" : "Nuevo DJ"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Nombre Completo *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingDJ?.name}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-white">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      name="slug"
                      defaultValue={editingDJ?.slug}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-white">Rol / Especialidad</Label>
                  <Input
                    id="role"
                    name="role"
                    defaultValue={editingDJ?.role}
                    placeholder="Ej: DJ Principal, Locutor de Alabanza"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-white">Biografía</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    defaultValue={editingDJ?.bio}
                    className="bg-white/10 border-white/20 text-white"
                    rows={4}
                    placeholder="Cuéntanos sobre este siervo de Dios..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo_url" className="text-white">URL de Foto</Label>
                  <Input
                    id="photo_url"
                    name="photo_url"
                    type="url"
                    defaultValue={editingDJ?.photo_url}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Redes Sociales</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebook" className="text-white">Facebook</Label>
                      <Input
                        id="facebook"
                        name="facebook"
                        type="url"
                        defaultValue={editingDJ?.social_links?.facebook}
                        placeholder="https://facebook.com/..."
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter" className="text-white">Twitter</Label>
                      <Input
                        id="twitter"
                        name="twitter"
                        type="url"
                        defaultValue={editingDJ?.social_links?.twitter}
                        placeholder="https://twitter.com/..."
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram" className="text-white">Instagram</Label>
                      <Input
                        id="instagram"
                        name="instagram"
                        type="url"
                        defaultValue={editingDJ?.social_links?.instagram}
                        placeholder="https://instagram.com/..."
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtube" className="text-white">YouTube</Label>
                      <Input
                        id="youtube"
                        name="youtube"
                        type="url"
                        defaultValue={editingDJ?.social_links?.youtube}
                        placeholder="https://youtube.com/..."
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="is_featured"
                      name="is_featured"
                      defaultChecked={editingDJ?.is_featured || false}
                    />
                    <Label htmlFor="is_featured" className="text-white cursor-pointer">
                      DJ Destacado
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-white">Estado</Label>
                    <Select name="status" defaultValue={editingDJ?.status || "active"}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createDJMutation.isPending || updateDJMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#0056c0] hover:from-[#0056c0] hover:to-[#0045a0] text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingDJ ? "Actualizar" : "Crear"} DJ
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingDJ(null);
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-96 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : djs && djs.length > 0 ? (
            djs.map((dj) => (
              <Card key={dj.id} className="bg-white/5 border-white/10 overflow-hidden">
                <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-pink-500/20 to-purple-600/20">
                  {dj.photo_url ? (
                    <img
                      src={dj.photo_url}
                      alt={dj.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Mic2 className="w-20 h-20 text-purple-400" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {dj.is_featured && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-pink-500/90 text-white">
                        Destacado
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      dj.status === 'active'
                        ? 'bg-green-500/90 text-white'
                        : 'bg-red-500/90 text-white'
                    }`}>
                      {dj.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white mb-1">{dj.name}</h3>
                  {dj.role && (
                    <p className="text-purple-400 text-sm mb-2">{dj.role}</p>
                  )}
                  {dj.bio && (
                    <p className="text-gray-400 text-xs line-clamp-2 mb-3">{dj.bio}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(dj)}
                      className="flex-1 bg-[#006cf0] hover:bg-[#00479e] text-white"
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(dj.id)}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="bg-white/5 border-white/10 p-12 text-center">
                <Mic2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-xl text-gray-400 mb-4">No hay DJs configurados</p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-[#006cf0] to-[#0056c0] hover:from-[#0056c0] hover:to-[#0045a0] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer DJ
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
