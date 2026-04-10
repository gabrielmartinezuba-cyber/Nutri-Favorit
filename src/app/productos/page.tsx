import Link from 'next/link';

export default function BrandSelectorPage() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-white to-[#f0f7f0] z-50 flex flex-col items-center justify-center gap-20 px-8 pb-16">
      
      {/* 3D Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px) perspective(500px) rotateX(2deg); }
          50% { transform: translateY(-10px) perspective(500px) rotateX(-2deg); }
          100% { transform: translateY(0px) perspective(500px) rotateX(2deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out infinite 3s;
        }
        .shadow-3d {
          filter: drop-shadow(0 20px 25px rgba(0,0,0,0.15)) drop-shadow(0 10px 10px rgba(0,0,0,0.1));
        }
      `}} />

      <Link href="/tienda/favorit" className="w-full max-w-[280px] transition-transform active:scale-95 flex flex-col items-center justify-center gap-4 group">
        <img 
          src="/logofav.png" 
          alt="Favorit Logo" 
          className="w-full h-auto object-contain animate-float shadow-3d group-hover:scale-105 transition-transform duration-300"
        />
        <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Congelados & Proteína</span>
      </Link>
      
      <Link href="/tienda/vitalfood" className="w-full max-w-[280px] transition-transform active:scale-95 flex flex-col items-center justify-center gap-6 group">
        <img 
          src="/logovitalfood.png" 
          alt="VitalFood Logo" 
          className="w-full h-auto object-contain animate-float-delayed shadow-3d scale-110 group-hover:scale-110 group-hover:drop-shadow-2xl transition-all duration-300"
        />
        <span className="text-sm font-bold text-[#3C5040] uppercase tracking-widest">Viandas del día</span>
      </Link>
    </div>
  );
}
