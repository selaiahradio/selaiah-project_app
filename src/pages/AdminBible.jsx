
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Plus, Trash2, Save, ArrowLeft, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { appParams } from "@/lib/app-params";

// --- START: NEW API LOGIC ---
const API_BASE_URL = "https://us-central1-selaiah-radio.cloudfunctions.net/api";
const FUNCTIONS_BASE_URL = "https://us-central1-selaiah-radio.cloudfunctions.net";
const token = appParams.token;

const fetcher = async (url, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error on ${url}: ${errorText}`);
        throw new Error(`Request failed: ${response.status}`);
    }
    if (response.status === 204) return null;
    return response.json();
};

const getBibleVerses = () => fetcher(`${API_BASE_URL}/bible_verses?sort=-created_date`);
const createBibleVerse = (data) => fetcher(`${API_BASE_URL}/bible_verses`, { method: 'POST', body: JSON.stringify(data) });
const updateBibleVerse = ({ id, data }) => fetcher(`${API_BASE_URL}/bible_verses/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
const deleteBibleVerse = (id) => fetcher(`${API_BASE_URL}/bible_verses/${id}`, { method: 'DELETE' });

const generateVersesWithAI = async () => {
    // This function now calls a dedicated, secure backend endpoint
    // instead of exposing a generic LLM invoker to the client.
    const result = await fetcher(`${FUNCTIONS_BASE_URL}/generatePentecostalVerses`, { method: 'POST' });
    
    // The backend function is expected to handle the creation of verses.
    // We just need to invalidate the query to refetch the list.
    if (result && result.success) {
        return result.count || 0;
    }
    throw new Error(result?.message || "Failed to generate verses");
};
// --- END: NEW API LOGIC ---

export default function AdminBiblePage() {
  const [editingVerse, setEditingVerse] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: verses, isLoading } = useQuery({
    queryKey: ['adminBibleVerses'],
    queryFn: getBibleVerses,
    initialData: [],
  });

  const createVerseMutation = useMutation({ mutationFn: createBibleVerse, /* ... */ });
  const updateVerseMutation = useMutation({ mutationFn: updateBibleVerse, /* ... */ });
  const deleteVerseMutation = useMutation({ mutationFn: deleteBibleVerse, /* ... */ });

  const generateVersesMutation = useMutation({
    mutationFn: generateVersesWithAI,
    onSuccess: (count) => {
        queryClient.invalidateQueries({ queryKey: ['adminBibleVerses'] });
        toast.success(`${count} versículos pentecostales generados exitosamente`);
    },
    onError: (error) => {
        toast.error(error.message || "Error generando versículos con IA");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const tags = formData.get('tags')?.split(',').map(t => t.trim()).filter(t => t) || [];
    const data = {
        book: formData.get('book'),
        chapter: parseInt(formData.get('chapter')),
        verse: parseInt(formData.get('verse')),
        text: formData.get('text'),
        version: formData.get('version'),
        testament: formData.get('testament'),
        category: formData.get('category'),
        tags, 
        // ... other fields are unchanged
    };
    const mutation = editingVerse ? updateVerseMutation : createVerseMutation;
    mutation.mutate(editingVerse ? { id: editingVerse.id, data } : data, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminBibleVerses'] });
            toast.success(`Versículo ${editingVerse ? 'actualizado' : 'creado'} con éxito`);
            setShowForm(false);
            setEditingVerse(null);
        },
        onError: (error) => toast.error(`Error: ${error.message}`)
    });
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de eliminar este versículo?")) {
      deleteVerseMutation.mutate(id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['adminBibleVerses'] });
          toast.success("Versículo eliminado");
        },
        onError: () => toast.error("Error al eliminar el versículo")
      });
    }
  };

  const handleEdit = (verse) => {
    setEditingVerse(verse);
    setShowForm(true);
  };
  
  const filteredVerses = (verses || []).filter(v =>
    v.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.book?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // The JSX part of the component remains largely the same,
  // but the `onClick` for the generation button now calls `generateVersesMutation.mutate()`.
  // All other data interactions use the new mutations.
  // Omitted for brevity.
  return (
    <div className="min-h-screen py-12">
        {/* UI is unchanged, so it is omitted for brevity */}
    </div>
  );
}
