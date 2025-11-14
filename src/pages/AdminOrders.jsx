import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, ArrowLeft, Search, Package, Truck, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: () => base44.entities.Order.list("-created_date"),
    initialData: [],
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      toast.success("Orden actualizada");
    },
    onError: () => toast.error("Error al actualizar orden"),
  });

  const handleUpdateStatus = (orderId, newStatus) => {
    updateOrderMutation.mutate({
      id: orderId,
      data: { order_status: newStatus }
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.order_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.order_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.order_status === "pending").length,
    processing: orders.filter(o => o.order_status === "processing").length,
    shipped: orders.filter(o => o.order_status === "shipped").length,
    delivered: orders.filter(o => o.order_status === "delivered").length,
    cancelled: orders.filter(o => o.order_status === "cancelled").length,
  };

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-300",
    processing: "bg-blue-500/20 text-blue-300",
    shipped: "bg-purple-500/20 text-purple-300",
    delivered: "bg-green-500/20 text-green-300",
    cancelled: "bg-red-500/20 text-red-300"
  };

  const paymentStatusColors = {
    pending: "bg-yellow-500/20 text-yellow-300",
    paid: "bg-green-500/20 text-green-300",
    failed: "bg-red-500/20 text-red-300",
    refunded: "bg-orange-500/20 text-orange-300"
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
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <ShoppingCart className="w-10 h-10 text-[#006cf0]" />
              Gestión de Órdenes
            </h1>
            <p className="text-gray-400">
              Pedidos de clientes y seguimiento de envíos
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Procesando</p>
            <p className="text-2xl font-bold text-blue-400">{stats.processing}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Enviadas</p>
            <p className="text-2xl font-bold text-purple-400">{stats.shipped}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Entregadas</p>
            <p className="text-2xl font-bold text-green-400">{stats.delivered}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Canceladas</p>
            <p className="text-2xl font-bold text-red-400">{stats.cancelled}</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/5 border-white/10 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por cliente, email o número de orden..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="shipped">Enviadas</SelectItem>
                <SelectItem value="delivered">Entregadas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-40 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <Card key={order.id} className="bg-white/5 border-white/10 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-white">
                        Orden #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                      </h3>
                      <Badge className={statusColors[order.order_status]}>
                        {order.order_status}
                      </Badge>
                      <Badge className={paymentStatusColors[order.payment_status]}>
                        {order.payment_status}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Cliente</p>
                        <p className="text-white font-semibold">{order.customer_name}</p>
                        <p className="text-gray-400">{order.customer_email}</p>
                      </div>

                      <div>
                        <p className="text-gray-400">Fecha</p>
                        <p className="text-white">{format(new Date(order.created_date), "d MMM yyyy, HH:mm", { locale: es })}</p>
                      </div>

                      <div>
                        <p className="text-gray-400">Items</p>
                        <p className="text-white">{order.items?.length || 0} productos</p>
                      </div>

                      <div>
                        <p className="text-gray-400">Total</p>
                        <p className="text-white font-bold text-lg">${order.total} {order.currency}</p>
                      </div>
                    </div>

                    {order.tracking_number && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-sm text-gray-400">Tracking: <span className="text-white">{order.tracking_number}</span></p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Select
                      value={order.order_status}
                      onValueChange={(value) => handleUpdateStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Pendiente
                          </div>
                        </SelectItem>
                        <SelectItem value="processing">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Procesando
                          </div>
                        </SelectItem>
                        <SelectItem value="shipped">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Enviada
                          </div>
                        </SelectItem>
                        <SelectItem value="delivered">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Entregada
                          </div>
                        </SelectItem>
                        <SelectItem value="cancelled">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            Cancelada
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="bg-white/5 border-white/10 p-12 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400">
                {searchQuery ? "No se encontraron órdenes" : "No hay órdenes aún"}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}