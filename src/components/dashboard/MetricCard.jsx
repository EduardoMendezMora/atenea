import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function MetricCard({ title, value, icon: Icon, color, trend, delay = 0 }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 text-blue-600",
    green: "from-emerald-500 to-emerald-600 text-emerald-600", 
    purple: "from-purple-500 to-purple-600 text-purple-600",
    orange: "from-orange-500 to-orange-600 text-orange-600"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-0 shadow-lg bg-white">
        <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-6 -translate-y-6 bg-gradient-to-br ${colorClasses[color]} rounded-full opacity-10`} />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">{title}</p>
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorClasses[color]} bg-opacity-20`}>
              <Icon className={`w-5 h-5 ${colorClasses[color].split(' ')[2]}`} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-3xl font-bold text-slate-900 mb-2">{value}</div>
          {trend && (
            <div className="text-sm text-slate-600 font-medium">{trend}</div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}