import React, { useState, useEffect } from 'react';
import { repository } from '../../services/repository';
import { Profile, UserRole } from '../../types';
import { Users, Search, Filter, ShieldCheck, Store, User, MapPin } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const list = await repository.getProfiles();
        setUsers(list);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-[#EAE3D9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#8C3D38] mb-1">
            Control de Identidades
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
            Gestión de Usuarios ({users.length})
          </h1>
          <p className="text-xs text-[#7A736E] mt-1">
            Directorio de compradores, vendedores y administradores en la plataforma Lunaria.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#A8A199] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="pl-8 pr-3 py-2 bg-white border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#8C3D38]"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="px-3 py-2 bg-white border border-[#EAE3D9] rounded-xl text-xs font-semibold text-[#2C2825] focus:outline-none"
          >
            <option value="all">Todos los roles</option>
            <option value="buyer">Compradores</option>
            <option value="florist">Vendedores / Floristas</option>
            <option value="admin">Administradores</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#8A8179]">Cargando usuarios...</div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#EAE3D9] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EAE3D9] bg-[#FAF8F5] text-[#8A8179]">
                  <th className="py-3 px-4 font-semibold">Usuario</th>
                  <th className="py-3 px-4 font-semibold">Rol en Lunaria</th>
                  <th className="py-3 px-4 font-semibold">Teléfono</th>
                  <th className="py-3 px-4 font-semibold">Direcciones Guardadas</th>
                  <th className="py-3 px-4 font-semibold">Fecha de Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#2C2825]">{user.fullName}</div>
                      <div className="text-[11px] text-[#8A8179]">{user.email}</div>
                    </td>

                    <td className="py-3 px-4">
                      {user.role === 'admin' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8C3D38] bg-[#FAF0ED] px-2.5 py-0.5 rounded border border-[#ECCECE]">
                          <ShieldCheck className="w-3 h-3" />
                          Administrador
                        </span>
                      )}
                      {user.role === 'florist' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5A735E] bg-[#EEF3EE] px-2.5 py-0.5 rounded border border-[#DCE8DD]">
                          <Store className="w-3 h-3" />
                          Florista / Vendedor
                        </span>
                      )}
                      {user.role === 'buyer' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5C534E] bg-slate-100 px-2.5 py-0.5 rounded">
                          <User className="w-3 h-3" />
                          Comprador
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[#665E58] tabular-nums">{user.phone}</td>

                    <td className="py-3 px-4 text-[#7A736E]">
                      {user.addresses && user.addresses.length > 0 ? (
                        <span>{user.addresses.length} ubicación(es) en Tlaxcala</span>
                      ) : (
                        <span className="text-[#A8A199]">Sin direcciones registradas</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[#8A8179] tabular-nums">
                      {new Date(user.createdAt).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
