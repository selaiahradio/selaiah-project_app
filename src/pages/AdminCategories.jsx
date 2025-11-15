
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Folder, Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
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

const getCategories = () => fetcher('/categories?sort=-created_date');
const createCategory = (data) => fetcher('/categories', { method: 'POST', body: JSON.stringify(data) });
const updateCategory = ({ id, data }) => fetcher(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
const deleteCategory = (id) => fetcher(`/categories/${id}`, { method: 'DELETE' });
// --- END: NEW API LOGIC ---


export default function AdminCategoriesPage() {
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: getCategories,
    initialData: [],
  });

  const handleMutationSuccess = (message) => {
    queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
    toast.success(message);
    setShowForm(false);
    setEditingCategory(null);
  };

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => handleMutationSuccess("Categoría creada exitosamente"),
    onError: () => toast.error("Error al crear la categoría"),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => handleMutationSuccess("Categoría actualizada exitosamente"),
    onError: () => toast.error("Error al actualizar la categoría"),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      toast.success("Categoría eliminada");
    },
    onError: () => toast.error("Error al eliminar la categoría"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description') || null,
      icon: formData.get('icon') || null,
      color: formData.get('color') || '#006cf0',
      image_url: formData.get('image_url') || null,
      order: formData.get('order') ? parseInt(formData.get('order')) : 0,
      is_active: formData.get('is_active') === 'on',
      seo_title: formData.get('seo_title') || null,
      seo_description: formData.get('seo_description') || null,
    };

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta categoría?")) {
      deleteCategoryMutation.mutate(id);
    }
  };
  
  // The JSX for the component is unchanged and is omitted here for brevity.
  return (
    <div className="min-h-screen py-12">
        {/* UI is unchanged, so it is omitted for brevity */}
    </div>
  );
}
