import Link from 'next/link';

export default function BrandSelectorPage() {
  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center gap-20 px-8 pb-16">
      <Link href="/tienda/favorit" className="w-full max-w-[280px] transition-transform active:scale-95 flex justify-center">
        <img 
          src="/logofav.png" 
          alt="Favorit Logo" 
          className="w-full h-auto object-contain"
        />
      </Link>
      
      <Link href="/tienda/vitalfood" className="w-full max-w-[280px] transition-transform active:scale-95 flex justify-center">
        <img 
          src="/logovitalfood.png" 
          alt="VitalFood Logo" 
          className="w-full h-auto object-contain"
        />
      </Link>
    </div>
  );
}
