import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, ArrowLeft, Search, DollarSign, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminDonationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: donations, isLoading } = useQuery({
    queryKey: ['adminDonations'],
    queryFn: () => base44.entities.Donation.list("-created_date"),
    initialData: [],
  });

  const updateDonationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Donation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDonations'] });
      toast.success("Donación actualizada");
    },
    onError: () => toast.error("Error al actualizar donación"),
  });

  const handleUpdateStatus = (donationId, newStatus) => {
    updateDonationMutation.mutate({
      id: donationId,
      data: { payment_status: newStatus }
    });
  };

  const handleMarkReceiptSent = (donationId) => {
    updateDonationMutation.mutate({
      id: donationId,
      data: { receipt_sent: true }
    });
  };

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = donation.donor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         donation.donor_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || donation.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: donations.reduce((sum, d) => sum + (d.amount || 0), 0),
    count: donations.length,
    completed: donations.filter(d => d.payment_status === "completed").reduce((sum, d) => sum + d.amount, 0),
    pending: donations.filter(d => d.payment_status === "pending").reduce((sum, d) => sum + d.amount, 0),
    recurring: donations.filter(d => d.is_recurring).length,
    anonymous: donations.filter(d => d.is_anonymous).length,
  };

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-300",
    completed: "bg-green-500/20 text-green-300",
    failed: "bg-red-500/20 text-red-300",
    refunded: "bg-orange-500/20 text-orange-300"
  };

  const purposeLabels = {
    general: "General",
    ministry: "Ministerio",
    missions: "Misiones",
    building: "Edificio",
    technology: "Tecnología",
    community: "Comunidad"
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
              <Heart className="w-10 h-10 text-red-400 fill-red-400" />
              Gestión de Donaciones
            </h1>
            <p className="text-gray-400">
              Donaciones y ofrendas recibidas
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10 p-4 md:col-span-2">
            <p className="text-gray-400 text-sm mb-1">Total Recaudado</p>
            <p className="text-3xl font-bold text-green-400">${stats.total.toFixed(2)}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Donaciones</p>
            <p className="text-2xl font-bold text-white">{stats.count}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Completadas</p>
            <p className="text-2xl font-bold text-green-400">${stats.completed.toFixed(2)}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-400">${stats.pending.toFixed(2)}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Recurrentes</p>
            <p className="text-2xl font-bold text-purple-400">{stats.recurring}</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/5 border-white/10 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o email..."
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
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="failed">Fallidas</SelectItem>
                <SelectItem value="refunded">Reembolsadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Donations List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : filteredDonations.length > 0 ? (
            filteredDonations.map((donation) => (
              <Card key={donation.id} className="bg-white/5 border-white/10 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-white">
                        {donation.is_anonymous ? "Donación Anónima" : donation.donor_name}
                      </h3>
                      <Badge className={statusColors[donation.payment_status]}>
                        {donation.payment_status}
                      </Badge>
                      {donation.is_recurring && (
                        <Badge className="bg-purple-500/20 text-purple-300">
                          Recurrente - {donation.frequency}
                        </Badge>
                      )}
                      {donation.receipt_sent && (
                        <Badge className="bg-blue-500/20 text-blue-300">
                          Recibo Enviado
                        </Badge>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Monto</p>
                        <p className="text-white font-bold text-xl">
                          ${donation.amount} {donation.currency}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400">Email</p>
                        <p className="text-white">{donation.donor_email}</p>
                      </div>

                      <div>
                        <p className="text-gray-400">Propósito</p>
                        <p className="text-white">{purposeLabels[donation.purpose]}</p>
                      </div>

                      <div>
                        <p className="text-gray-400">Fecha</p>
                        <p className="text-white">
                          {format(new Date(donation.created_date), "d MMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>

                    {donation.message && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-sm text-gray-400">Mensaje:</p>
                        <p className="text-white text-sm italic">"{donation.message}"</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Select
                      value={donation.payment_status}
                      onValueChange={(value) => handleUpdateStatus(donation.id, value)}
                    >
                      <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="completed">Completada</SelectItem>
                        <SelectItem value="failed">Fallida</SelectItem>
                        <SelectItem value="refunded">Reembolsada</SelectItem>
                      </SelectContent>
                    </Select>

                    {!donation.receipt_sent && donation.payment_status === "completed" && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkReceiptSent(donation.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Marcar Recibo Enviado
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="bg-white/5 border-white/10 p-12 text-center">
              <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400">
                {searchQuery ? "No se encontraron donaciones" : "No hay donaciones aún"}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}