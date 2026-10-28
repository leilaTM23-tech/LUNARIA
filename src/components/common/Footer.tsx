import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Shield, MessageCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[#EAE3D9] text-[#5C534E] text-xs pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#EAE3D9]">
          {/* Columna 1: Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="font-serif text-2xl font-bold text-[#2C2825] tracking-tight">
              Lunaria
            </Link>
            <p className="mt-2 text-xs text-[#7A736E] leading-relaxed">
              El primer marketplace floral dedicado a impulsar a las florerías artesanales del estado de Tlaxcala, México. Flores frescas, atención directa y entregas locales garantizadas.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#5A735E]">
              <MapPin className="w-3.5 h-3.5" />
              <span>Tlaxcala · Apizaco · Huamantla · Chiautempan</span>
            </div>
          </div>

          {/* Columna 2: Catálogo y Ocasiones */}
          <div>
            <h4 className="font-semibold text-sm text-[#2C2825] mb-3">Catálogo</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/catalogo?cat=cat-rosas" className="hover:text-[#B25E5C]">Ramos de rosas selectas</Link></li>
              <li><Link to="/catalogo?cat=cat-girasoles" className="hover:text-[#B25E5C]">Girasoles vibrantes</Link></li>
              <li><Link to="/catalogo?cat=cat-tulipanes" className="hover:text-[#B25E5C]">Tulipanes holandeses</Link></li>
              <li><Link to="/catalogo?cat=cat-aniversarios" className="hover:text-[#B25E5C]">Flores para aniversario</Link></li>
              <li><Link to="/catalogo?cat=cat-condolencias" className="hover:text-[#B25E5C]">Arreglos de condolencia</Link></li>
            </ul>
          </div>

          {/* Columna 3: Florerías y Vendedores */}
          <div>
            <h4 className="font-semibold text-sm text-[#2C2825] mb-3">Floristas Locales</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/florerias" className="hover:text-[#B25E5C]">Directorio de florerías</Link></li>
              <li><Link to="/vende-con-nosotros" className="text-[#8C3D38] font-semibold hover:underline">Vende con nosotros</Link></li>
              <li><Link to="/registro-invitacion" className="hover:text-[#B25E5C]">Canjear código de invitación</Link></li>
              <li><Link to="/vendedor" className="hover:text-[#B25E5C]">Panel de floristas</Link></li>
            </ul>
          </div>

          {/* Columna 4: Confianza y WhatsApp */}
          <div>
            <h4 className="font-semibold text-sm text-[#2C2825] mb-3">Compromiso Lunaria</h4>
            <div className="space-y-2 text-xs text-[#7A736E]">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-[#5A735E] shrink-0 mt-0.5" />
                <span>Florerías verificadas con ubicación física en municipios de Tlaxcala.</span>
              </div>
              <div className="flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                <span>Comunicación directa vía WhatsApp para acordar pago y detalles de dedicatoria.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#8A8179]">
          <div>
            © {new Date().getFullYear()} Lunaria Marketplace. Diseñado para comunidades de Tlaxcala.
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span>Hecho con amor</span>
            <Heart className="w-3.5 h-3.5 text-[#B25E5C] fill-[#B25E5C]" />
            <span>en Tlaxcala, México</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
