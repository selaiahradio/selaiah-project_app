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
import { ShoppingBag, Plus, Trash2, Save, ArrowLeft, Search, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminShopPage() {
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => base44.entities.Product.list("-created_date"),
    initialData: [],
  });

  const createProductMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Producto creado exitosamente");
      setShowForm(false);
      setEditingProduct(null);
    },
    onError: () => toast.error("Error al crear el producto"),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Producto actualizado");
      setShowForm(false);
      setEditingProduct(null);
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Producto eliminado");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const imagesString = formData.get('images');
    const images = imagesString ? imagesString.split(',').map(url => url.trim()).filter(url => url) : [];

    const tagsString = formData.get('tags');
    const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(t => t) : [];

    const data = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      category: formData.get('category'),
      type: formData.get('type'),
      price: parseFloat(formData.get('price')),
      compare_at_price: formData.get('compare_at_price') ? parseFloat(formData.get('compare_at_price')) : null,
      currency: formData.get('currency'),
      images,
      stock: parseInt(formData.get('stock')) || 0,
      sku: formData.get('sku') || null,
      tags,
      is_featured: formData.get('is_featured') === 'on',
      is_available: formData.get('is_available') === 'on',
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      deleteProductMutation.mutate(id);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <ShoppingBag className="w-10 h-10 text-[#006cf0]" />
                Gestión de Tienda
              </h1>
              <p className="text-gray-400">
                Productos y merchandise de Selaiah Radio
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingProduct(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </motion.div>

        {/* Search */}
        <Card className="bg-white/5 border-white/10 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white"
            />
          </div>
        </Card>

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-white/5 border-white/10 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingProduct ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Nombre *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingProduct?.name}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-white">Slug *</Label>
                    <Input
                      id="slug"
                      name="slug"
                      defaultValue={editingProduct?.slug}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Descripción</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingProduct?.description}
                    className="bg-white/10 border-white/20 text-white"
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-white">Categoría</Label>
                    <Select name="category" defaultValue={editingProduct?.category || "clothing"}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clothing">Ropa</SelectItem>
                        <SelectItem value="accessories">Accesorios</SelectItem>
                        <SelectItem value="music">Música</SelectItem>
                        <SelectItem value="books">Libros</SelectItem>
                        <SelectItem value="home">Hogar</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-white">Tipo</Label>
                    <Select name="type" defaultValue={editingProduct?.type || "t-shirt"}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="t-shirt">Camiseta</SelectItem>
                        <SelectItem value="hoodie">Sudadera</SelectItem>
                        <SelectItem value="cap">Gorra</SelectItem>
                        <SelectItem value="mug">Taza</SelectItem>
                        <SelectItem value="bag">Bolso</SelectItem>
                        <SelectItem value="cd">CD</SelectItem>
                        <SelectItem value="book">Libro</SelectItem>
                        <SelectItem value="poster">Póster</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock" className="text-white">Stock</Label>
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      defaultValue={editingProduct?.stock || 0}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-white">Precio *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue={editingProduct?.price}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="compare_at_price" className="text-white">Precio Antes</Label>
                    <Input
                      id="compare_at_price"
                      name="compare_at_price"
                      type="number"
                      step="0.01"
                      defaultValue={editingProduct?.compare_at_price}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-white">Moneda</Label>
                    <Select name="currency" defaultValue={editingProduct?.currency || "USD"}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="MXN">MXN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="images" className="text-white">URLs de Imágenes (separadas por coma)</Label>
                    <Textarea
                      id="images"
                      name="images"
                      defaultValue={editingProduct?.images?.join(', ')}
                      className="bg-white/10 border-white/20 text-white"
                      rows={2}
                      placeholder="https://imagen1.jpg, https://imagen2.jpg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku" className="text-white">SKU</Label>
                    <Input
                      id="sku"
                      name="sku"
                      defaultValue={editingProduct?.sku}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-white">Etiquetas (separadas por coma)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    defaultValue={editingProduct?.tags?.join(', ')}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="cristiano, alabanza, música"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="is_featured"
                      name="is_featured"
                      defaultChecked={editingProduct?.is_featured || false}
                    />
                    <Label htmlFor="is_featured" className="text-white cursor-pointer">
                      Producto Destacado
                    </Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      id="is_available"
                      name="is_available"
                      defaultChecked={editingProduct?.is_available ?? true}
                    />
                    <Label htmlFor="is_available" className="text-white cursor-pointer">
                      Disponible
                    </Label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createProductMutation.isPending || updateProductMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingProduct ? "Actualizar" : "Crear"} Producto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingProduct(null);
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

        {/* Products List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <Card key={product.id} className="bg-white/5 border-white/10 overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-16 h-16 text-blue-400" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{product.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl font-bold text-white">${product.price}</span>
                    {product.compare_at_price && (
                      <span className="text-sm text-gray-400 line-through">${product.compare_at_price}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                      {product.category}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                      Stock: {product.stock}
                    </span>
                    {product.is_featured && (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300">
                        Destacado
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="flex-1 bg-[#006cf0] hover:bg-[#00479e] text-white"
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      className="bg-red-600 hover:bg-red-700 text-white"
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
                <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-xl text-gray-400 mb-4">No hay productos</p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Producto
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}