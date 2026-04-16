"use client";

import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative w-full rounded-3xl overflow-hidden shadow-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brand-verde to-[#1a3a2f] z-0" />
      
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-brand-mostaza rounded-full mix-blend-screen filter blur-[80px] opacity-40 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-verde rounded-full mix-blend-screen filter blur-[100px] opacity-30" />

      <div className="relative z-10 p-8 flex flex-col h-full text-white">
        {/* Assistant Badge Removed */}

        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl font-heading font-bold leading-tight mb-4"
        >
          Come mejor,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mostaza to-[#FFF0B3]">vive mejor.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-sm text-gray-200 mb-8 max-w-[85%] font-medium"
        >
          La solución a tus comidas creadas por nutricionistas, ¡todo pensado para acompañar tu nutrición y objetivos!
        </motion.p>

        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Link href="/tienda/favorit" className="inline-flex items-center justify-center w-full bg-white text-brand-verde font-bold py-4 rounded-2xl shadow-lg hover:shadow-white/20 hover:scale-[1.02] transition-all active:scale-95 text-[15px]">
            <ShoppingBag className="w-5 h-5 mr-2" />
            Ir a la tienda
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}
