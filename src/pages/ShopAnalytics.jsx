import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ShoppingCart, 
  DollarSign, 
  Package, 
  TrendingUp, 
  ArrowLeft,
  MapPin,
  Heart,
  Users,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ShopAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30");

  const { data: orders = [] } = useQuery({
    queryKey: ['analyticsOrders'],
    queryFn: () => base44.entities.Order.list("-created_date"),
    initialData: [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ['analyticsProducts'],
    queryFn: () => base44.entities.Product.list("-sales_count"),
    initialData: [],
  });

  const { data: donations = [] } = useQuery({
    queryKey: ['analyticsDonations'],
    queryFn: () => base44.entities.Donation.list("-created_date"),
    initialData: [],
  });

  // Filter data by time range
  const filterByTimeRange = (items) => {
    if (timeRange === "all") return items;
    const days = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return items.filter(item => new Date(item.created_date) >= cutoffDate);
  };

  const filteredOrders = filterByTimeRange(orders);
  const filteredDonations = filterByTimeRange(donations);

  // Calculate metrics
  const totalRevenue = filteredOrders.reduce((sum, order) => 
    order.payment_status === 'paid' ? sum + (order.total || 0) : sum, 0
  );

  const totalDonations = filteredDonations.reduce((sum, donation) => 
    donation.payment_status === 'completed' ? sum + (donation.amount || 0) : sum, 0
  );

  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter(o => o.order_status === 'pending').length;
  const completedOrders = filteredOrders.filter(o => o.order_status === 'delivered').length;

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 10).length;
  const outOfStockProducts = products.filter(p => p.stock === 0).length;

  // Top selling products
  const topProducts = products
    .filter(p => p.sales_count > 0)
    .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
    .slice(0, 5);

  // Sales by category
  const salesByCategory = products.reduce((acc, product) => {
    if (!product.sales_count) return acc;
    const category = product.category || 'other';
    if (!acc[category]) {
      acc[category] = { name: category, value: 0 };
    }
    acc[category].value += product.sales_count;
    return acc;
  }, {});

  const categoryData = Object.values(salesByCategory);

  // Orders by location
  const ordersByLocation = filteredOrders.reduce((acc, order) => {
    const city = order.shipping_address?.city || 'Desconocido';
    if (!acc[city]) {
      acc[city] = { name: city, count: 0, revenue: 0 };
    }
    acc[city].count += 1;
    if (order.payment_status === 'paid') {
      acc[city].revenue += order.total || 0;
    }
    return acc;
  }, {});

  const locationData = Object.values(ordersByLocation)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Sales over time
  const salesOverTime = filteredOrders.reduce((acc, order) => {
    if (order.payment_status !== 'paid') return acc;
    const date = format(new Date(order.created_date), 'dd/MM', { locale: es });
    if (!acc[date]) {
      acc[date] = { date, sales: 0, orders: 0 };
    }
    acc[date].sales += order.total || 0;
    acc[date].orders += 1;
    return acc;
  }, {});

  const salesTimeData = Object.values(salesOverTime).slice(-30);

  const COLORS = ['#006cf0', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

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
                <TrendingUp className="w-10 h-10 text-[#006cf0]" />
                Métricas de Tienda
              </h1>
              <p className="text-gray-400">
                Análisis de ventas, inventario y donaciones
              </p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 90 días</SelectItem>
                <SelectItem value="365">Último año</SelectItem>
                <SelectItem value="all">Todo el tiempo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Ingresos Ventas</p>
                <p className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Órdenes</p>
                <p className="text-2xl font-bold text-white">{totalOrders}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Productos</p>
                <p className="text-2xl font-bold text-white">{totalProducts}</p>
                <p className="text-xs text-red-400 mt-1">{outOfStockProducts} agotados</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-600/20 to-pink-600/20 border-red-500/30 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Donaciones</p>
                <p className="text-2xl font-bold text-white">${totalDonations.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Order Status */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Pendientes</p>
            <p className="text-3xl font-bold text-yellow-400">{pendingOrders}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Completadas</p>
            <p className="text-3xl font-bold text-green-400">{completedOrders}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Stock Bajo</p>
            <p className="text-3xl font-bold text-orange-400">{lowStockProducts}</p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Sales Over Time */}
          <Card className="bg-white/5 border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Ventas en el Tiempo
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#006cf0" name="Ventas ($)" strokeWidth={2} />
                <Line type="monotone" dataKey="orders" stroke="#10b981" name="Órdenes" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Sales by Category */}
          <Card className="bg-white/5 border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" />
              Ventas por Categoría
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Top Products */}
        <Card className="bg-white/5 border-white/10 p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Productos Más Vendidos
          </h3>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                {product.images?.[0] && (
                  <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded object-cover" />
                )}
                <div className="flex-1">
                  <p className="text-white font-semibold">{product.name}</p>
                  <p className="text-sm text-gray-400">${product.price}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{product.sales_count} ventas</p>
                  <p className="text-sm text-gray-400">Stock: {product.stock}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Sales by Location */}
        <Card className="bg-white/5 border-white/10 p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-400" />
            Ventas por Ubicación
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={locationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="count" fill="#006cf0" name="Órdenes" />
              <Bar dataKey="revenue" fill="#10b981" name="Ingresos ($)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}