/**
 * Colección de ilustraciones florales vectoriales de alta fidelidad para el catálogo de Lunaria.
 * Se representan en formato SVG optimizado para garantizar visualización inmediata,
 * cero imágenes rotas y estética artesanal premium acorde a florerías de diseño.
 */

export const FLOWER_PALETTES = {
  roseBlush: {
    bg: 'from-[#FDF2F0] to-[#F5DFDC]',
    primary: '#C86D67',
    secondary: '#DE9E99',
    accent: '#8C3D38',
    leaf: '#5D735E',
  },
  sunflowerWarm: {
    bg: 'from-[#FEF9E7] to-[#FCEBB7]',
    primary: '#D9981E',
    secondary: '#F2B93B',
    accent: '#80500B',
    leaf: '#4F6851',
  },
  tulipPastel: {
    bg: 'from-[#F9F0F5] to-[#EBD5E2]',
    primary: '#B6608F',
    secondary: '#D894B9',
    accent: '#732F54',
    leaf: '#526955',
  },
  sympathyPeace: {
    bg: 'from-[#F5F7F8] to-[#E3E8EB]',
    primary: '#60727D',
    secondary: '#9EB0BC',
    accent: '#334047',
    leaf: '#455948',
  },
  anniversaryRomantic: {
    bg: 'from-[#FAEDEE] to-[#EFC7CA]',
    primary: '#A33742',
    secondary: '#C96872',
    accent: '#5E1B23',
    leaf: '#3B523E',
  },
  seasonWild: {
    bg: 'from-[#F3F6ED] to-[#DDE7CF]',
    primary: '#85964B',
    secondary: '#B5C47F',
    accent: '#4C5824',
    leaf: '#3E5035',
  },
};

// Generador de SVG decorativo floral como Data URI
export function getFloralSvg(type: 'roses' | 'sunflowers' | 'tulips' | 'arrangement' | 'sympathy' | 'birthday' | 'seasonal' | 'custom'): string {
  let content = '';

  if (type === 'roses') {
    content = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
        <defs>
          <linearGradient id="bg_r" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FBF4F2" />
            <stop offset="100%" stop-color="#EEDDD9" />
          </linearGradient>
          <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" flood-opacity="0.12" flood-color="#8C3D38" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg_r)" />
        <g transform="translate(200, 260) scale(1.1)">
          <!-- Wrapping craft paper -->
          <polygon points="0,-160 -90,40 90,40" fill="#E4D2C3" opacity="0.9" />
          <polygon points="0,-140 -70,30 70,30" fill="#D8C2B0" opacity="0.95" />
          <path d="M -30,20 Q 0,45 30,20 Q 40,-5 0,-10 Q -40,-5 -30,20 Z" fill="#C95F63" opacity="0.85" />
          <!-- Stems and leaves -->
          <path d="M 0,20 Q -40,-90 -60,-130" stroke="#526A54" stroke-width="5" fill="none" stroke-linecap="round"/>
          <path d="M 0,20 Q 0,-90 0,-140" stroke="#526A54" stroke-width="5" fill="none" stroke-linecap="round"/>
          <path d="M 0,20 Q 40,-90 60,-130" stroke="#526A54" stroke-width="5" fill="none" stroke-linecap="round"/>
          <ellipse cx="-40" cy="-80" rx="14" ry="7" transform="rotate(-30 -40 -80)" fill="#68836A" />
          <ellipse cx="40" cy="-80" rx="14" ry="7" transform="rotate(30 40 -80)" fill="#68836A" />
          <ellipse cx="-20" cy="-120" rx="12" ry="6" transform="rotate(-15 -20 -120)" fill="#68836A" />
          <ellipse cx="25" cy="-115" rx="12" ry="6" transform="rotate(20 25 -115)" fill="#68836A" />
          <!-- Rose blooms -->
          <!-- Central Rose -->
          <g transform="translate(0, -145)" filter="url(#soft)">
            <circle cx="0" cy="0" r="34" fill="#C7595F" />
            <circle cx="-3" cy="-2" r="28" fill="#D66D73" />
            <path d="M -16,-10 Q 0,-25 16,-10 Q 25,12 0,22 Q -25,12 -16,-10 Z" fill="#E8878D" />
            <path d="M -10,-5 Q 0,-15 10,-5 Q 15,6 0,12 Q -15,6 -10,-5 Z" fill="#F4A6AC" />
            <circle cx="0" cy="0" r="7" fill="#8E2D34" />
          </g>
          <!-- Left Rose -->
          <g transform="translate(-55, -125) scale(0.85)" filter="url(#soft)">
            <circle cx="0" cy="0" r="32" fill="#BA4C52" />
            <circle cx="-2" cy="-2" r="26" fill="#CB6066" />
            <path d="M -14,-9 Q 0,-22 14,-9 Q 20,10 0,19 Q -20,10 -14,-9 Z" fill="#E27C83" />
            <circle cx="0" cy="0" r="6" fill="#802128" />
          </g>
          <!-- Right Rose -->
          <g transform="translate(55, -125) scale(0.85)" filter="url(#soft)">
            <circle cx="0" cy="0" r="32" fill="#D2747A" />
            <circle cx="-2" cy="-2" r="26" fill="#E3898F" />
            <path d="M -14,-9 Q 0,-22 14,-9 Q 20,10 0,19 Q -20,10 -14,-9 Z" fill="#F1A2A7" />
            <circle cx="0" cy="0" r="6" fill="#99383E" />
          </g>
          <!-- Accent flower bud -->
          <circle cx="0" cy="-195" r="14" fill="#F5CED0" />
          <circle cx="-28" cy="-170" r="11" fill="#F8DFE1" />
          <circle cx="28" cy="-170" r="11" fill="#F8DFE1" />
        </g>
      </svg>
    `;
  } else if (type === 'sunflowers') {
    content = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
        <defs>
          <linearGradient id="bg_s" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FCF8EC" />
            <stop offset="100%" stop-color="#F2E6C6" />
          </linearGradient>
          <filter id="soft_s">
            <feDropShadow dx="0" dy="5" stdDeviation="6" flood-opacity="0.14" flood-color="#6B4106" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg_s)" />
        <g transform="translate(200, 240)">
          <!-- Craft wrapper -->
          <polygon points="0,-140 -80,45 80,45" fill="#4B634E" opacity="0.85" />
          <path d="M -25,25 Q 0,45 25,25 Q 30,5 0,0 Q -30,5 -25,25 Z" fill="#E8B54D" />
          <!-- Stems -->
          <path d="M 0,20 Q -30,-80 -50,-120" stroke="#3D503F" stroke-width="6" fill="none"/>
          <path d="M 0,20 Q 0,-70 0,-130" stroke="#3D503F" stroke-width="6" fill="none"/>
          <path d="M 0,20 Q 30,-80 50,-120" stroke="#3D503F" stroke-width="6" fill="none"/>
          <!-- Central Sunflower -->
          <g transform="translate(0, -130)" filter="url(#soft_s)">
            <!-- Petals loop -->
            <g fill="#F5BA27">
              <ellipse cx="0" cy="-45" rx="9" ry="24" />
              <ellipse cx="32" cy="-32" rx="9" ry="24" transform="rotate(45 32 -32)" />
              <ellipse cx="45" cy="0" rx="9" ry="24" transform="rotate(90 45 0)" />
              <ellipse cx="32" cy="32" rx="9" ry="24" transform="rotate(135 32 32)" />
              <ellipse cx="0" cy="45" rx="9" ry="24" />
              <ellipse cx="-32" cy="32" rx="9" ry="24" transform="rotate(45 -32 32)" />
              <ellipse cx="-45" cy="0" rx="9" ry="24" transform="rotate(90 -45 0)" />
              <ellipse cx="-32" cy="-32" rx="9" ry="24" transform="rotate(135 -32 -32)" />
            </g>
            <g fill="#EAA115" transform="rotate(22.5)">
              <ellipse cx="0" cy="-42" rx="8" ry="22" />
              <ellipse cx="30" cy="-30" rx="8" ry="22" transform="rotate(45 30 -30)" />
              <ellipse cx="42" cy="0" rx="8" ry="22" transform="rotate(90 42 0)" />
              <ellipse cx="30" cy="30" rx="8" ry="22" transform="rotate(135 30 30)" />
              <ellipse cx="0" cy="42" rx="8" ry="22" />
              <ellipse cx="-30" cy="30" rx="8" ry="22" transform="rotate(45 -30 30)" />
              <ellipse cx="-42" cy="0" rx="8" ry="22" transform="rotate(90 -42 0)" />
              <ellipse cx="-30" cy="-30" rx="8" ry="22" transform="rotate(135 -30 -30)" />
            </g>
            <!-- Center disc -->
            <circle cx="0" cy="0" r="26" fill="#4A2F0F" />
            <circle cx="0" cy="0" r="22" fill="#5E3C14" stroke="#7A501E" stroke-dasharray="3,2" stroke-width="2" />
            <circle cx="0" cy="0" r="14" fill="#3D2409" />
          </g>
          <!-- Mini side sunflowers -->
          <g transform="translate(-65, -100) scale(0.65)" filter="url(#soft_s)">
            <circle cx="0" cy="0" r="45" fill="#F8C43A" />
            <circle cx="0" cy="0" r="22" fill="#52320E" />
          </g>
          <g transform="translate(65, -100) scale(0.65)" filter="url(#soft_s)">
            <circle cx="0" cy="0" r="45" fill="#F8C43A" />
            <circle cx="0" cy="0" r="22" fill="#52320E" />
          </g>
        </g>
      </svg>
    `;
  } else if (type === 'tulips') {
    content = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
        <defs>
          <linearGradient id="bg_t" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FAF1F4" />
            <stop offset="100%" stop-color="#EEDDE6" />
          </linearGradient>
          <filter id="soft_t">
            <feDropShadow dx="0" dy="5" stdDeviation="6" flood-opacity="0.12" flood-color="#80345F" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg_t)" />
        <g transform="translate(200, 240)">
          <!-- Glass vase or modern wrapper -->
          <path d="M -45,40 L -30,-80 L 30,-80 L 45,40 Z" fill="white" opacity="0.65" stroke="#D1C3CB" stroke-width="1.5" />
          <!-- Stems -->
          <path d="M -20,-70 Q -40,-130 -40,-160" stroke="#5E7D61" stroke-width="5" fill="none" stroke-linecap="round"/>
          <path d="M 0,-70 Q 0,-140 0,-175" stroke="#5E7D61" stroke-width="5" fill="none" stroke-linecap="round"/>
          <path d="M 20,-70 Q 40,-130 40,-160" stroke="#5E7D61" stroke-width="5" fill="none" stroke-linecap="round"/>
          <!-- Long leaves -->
          <path d="M -10,-75 Q -55,-120 -35,-155 Q -25,-120 -5,-90" fill="#729476" opacity="0.9" />
          <path d="M 10,-75 Q 55,-120 35,-155 Q 25,-120 5,-90" fill="#729476" opacity="0.9" />
          <!-- Center Tulip Cup -->
          <g transform="translate(0, -180)" filter="url(#soft_t)">
            <path d="M -22,15 C -25,-15 -18,-35 0,-40 C 18,-35 25,-15 22,15 C 16,30 -16,30 -22,15 Z" fill="#C55685" />
            <path d="M -14,12 C -18,-8 -10,-28 0,-34 C 10,-28 18,-8 14,12 C 10,22 -10,22 -14,12 Z" fill="#D9729E" />
            <path d="M -6,8 C -8,-4 -5,-20 0,-24 C 5,-20 8,-4 6,8 C 4,14 -4,14 -6,8 Z" fill="#ED99BF" />
          </g>
          <!-- Left Tulip Cup -->
          <g transform="translate(-40, -165) rotate(-12)" filter="url(#soft_t)">
            <path d="M -18,12 C -20,-12 -14,-28 0,-32 C 14,-28 20,-12 18,12 C 12,24 -12,24 -18,12 Z" fill="#BA4676" />
            <path d="M -10,8 C -13,-5 -7,-18 0,-22 C 7,-18 13,-5 10,8 C 6,15 -6,15 -10,8 Z" fill="#CF6592" />
          </g>
          <!-- Right Tulip Cup -->
          <g transform="translate(40, -165) rotate(12)" filter="url(#soft_t)">
            <path d="M -18,12 C -20,-12 -14,-28 0,-32 C 14,-28 20,-12 18,12 C 12,24 -12,24 -18,12 Z" fill="#E079A3" />
            <path d="M -10,8 C -13,-5 -7,-18 0,-22 C 7,-18 13,-5 10,8 C 6,15 -6,15 -10,8 Z" fill="#F09BBE" />
          </g>
        </g>
      </svg>
    `;
  } else if (type === 'sympathy') {
    content = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
        <defs>
          <linearGradient id="bg_sy" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#F7F8FA" />
            <stop offset="100%" stop-color="#E5EAEE" />
          </linearGradient>
          <filter id="soft_sy">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.1" flood-color="#36454F" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg_sy)" />
        <g transform="translate(200, 150)">
          <!-- Wreath ring -->
          <circle cx="0" cy="0" r="80" stroke="#7E9683" stroke-width="12" fill="none" opacity="0.6" stroke-dasharray="8,4" />
          <!-- Leaf clusters -->
          <g fill="#4F6653">
            <ellipse cx="0" cy="-80" rx="18" ry="7" transform="rotate(-15 0 -80)" />
            <ellipse cx="60" cy="-55" rx="18" ry="7" transform="rotate(35 60 -55)" />
            <ellipse cx="80" cy="15" rx="18" ry="7" transform="rotate(80 80 15)" />
            <ellipse cx="50" cy="65" rx="18" ry="7" transform="rotate(130 50 65)" />
            <ellipse cx="-50" cy="65" rx="18" ry="7" transform="rotate(-130 -50 65)" />
            <ellipse cx="-80" cy="15" rx="18" ry="7" transform="rotate(-80 -80 15)" />
            <ellipse cx="-60" cy="-55" rx="18" ry="7" transform="rotate(-35 -60 -55)" />
          </g>
          <!-- Pure White Lilies & White Roses -->
          <g transform="translate(0, -80)" filter="url(#soft_sy)">
            <circle cx="0" cy="0" r="24" fill="#FFFFFF" />
            <circle cx="0" cy="0" r="18" fill="#F5F7F8" />
            <circle cx="0" cy="0" r="8" fill="#D2DEBE" />
          </g>
          <g transform="translate(-50, 45)" filter="url(#soft_sy)">
            <circle cx="0" cy="0" r="22" fill="#FFFFFF" />
            <circle cx="0" cy="0" r="16" fill="#F2F5F7" />
            <circle cx="0" cy="0" r="6" fill="#D2DEBE" />
          </g>
          <g transform="translate(50, 45)" filter="url(#soft_sy)">
            <circle cx="0" cy="0" r="22" fill="#FFFFFF" />
            <circle cx="0" cy="0" r="16" fill="#F2F5F7" />
            <circle cx="0" cy="0" r="6" fill="#D2DEBE" />
          </g>
          <!-- Silk ribbon drape -->
          <path d="M 0,60 C -15,100 -30,120 -35,140 M 0,60 C 15,100 30,120 35,140" stroke="#BAC7D0" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.8" />
        </g>
      </svg>
    `;
  } else {
    // Elegant Multi-flower botanical arrangement
    content = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
        <defs>
          <linearGradient id="bg_m" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FAF6F0" />
            <stop offset="100%" stop-color="#EBE3D7" />
          </linearGradient>
          <filter id="soft_m">
            <feDropShadow dx="0" dy="5" stdDeviation="6" flood-opacity="0.12" flood-color="#543A29" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg_m)" />
        <g transform="translate(200, 240)">
          <!-- Ceramic artisan pot -->
          <path d="M -45,40 L -55,-35 L 55,-35 L 45,40 Z" fill="#DDD1C1" stroke="#BAAA94" stroke-width="2" />
          <path d="M -55,-35 Q 0,-45 55,-35" stroke="#BAAA94" stroke-width="2" fill="none" />
          <!-- Foliage -->
          <path d="M 0,-35 Q -60,-90 -80,-140" stroke="#5E7860" stroke-width="4" fill="none" />
          <path d="M 0,-35 Q 60,-90 80,-140" stroke="#5E7860" stroke-width="4" fill="none" />
          <path d="M 0,-35 Q 0,-120 0,-170" stroke="#5E7860" stroke-width="4" fill="none" />
          <ellipse cx="-50" cy="-110" rx="14" ry="7" transform="rotate(-30 -50 -110)" fill="#78957A" />
          <ellipse cx="50" cy="-110" rx="14" ry="7" transform="rotate(30 50 -110)" fill="#78957A" />
          <!-- Mixed Bloom 1: Peony center -->
          <g transform="translate(0, -135)" filter="url(#soft_m)">
            <circle cx="0" cy="0" r="32" fill="#D46F7A" />
            <circle cx="-3" cy="-3" r="26" fill="#E4858F" />
            <circle cx="2" cy="2" r="18" fill="#F4A5AD" />
            <circle cx="0" cy="0" r="7" fill="#8C353F" />
          </g>
          <!-- Mixed Bloom 2: Yellow Ranunculus -->
          <g transform="translate(-45, -95)" filter="url(#soft_m)">
            <circle cx="0" cy="0" r="24" fill="#EDB63B" />
            <circle cx="-2" cy="-2" r="18" fill="#F5C962" />
            <circle cx="0" cy="0" r="6" fill="#825C0D" />
          </g>
          <!-- Mixed Bloom 3: Lavender Lisianthus -->
          <g transform="translate(45, -100)" filter="url(#soft_m)">
            <circle cx="0" cy="0" r="25" fill="#9F78A8" />
            <circle cx="-2" cy="-2" r="19" fill="#B797BF" />
            <circle cx="0" cy="0" r="6" fill="#5E3867" />
          </g>
          <!-- Baby's breath accents -->
          <circle cx="-20" cy="-175" r="5" fill="#FFFFFF" />
          <circle cx="-10" cy="-185" r="4" fill="#FFFFFF" />
          <circle cx="15" cy="-178" r="5" fill="#FFFFFF" />
          <circle cx="30" cy="-160" r="4" fill="#FFFFFF" />
        </g>
      </svg>
    `;
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(content.trim())}`;
}
