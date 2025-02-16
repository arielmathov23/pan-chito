import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { TrashIcon, DocumentPlusIcon } from '@heroicons/react/24/outline';

interface PRDItem {
  id: string;
  title: string;
  createdAt: string;
}

interface PRDListProps {
  prds: PRDItem[];
  onDelete: (id: string) => void;
}

const PRDList = ({ prds, onDelete }: PRDListProps) => {
  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`¿Estás seguro que deseas eliminar el PRD "${title}"?\n\nEsta acción no se puede deshacer.`)) {
      onDelete(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {prds.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 max-w-2xl mx-auto">
            <div className="rounded-full bg-indigo-100 w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <DocumentPlusIcon className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No hay PRDs creados
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Comienza a crear tus Product Requirements Documents para documentar y compartir tus ideas de producto.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg 
                text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-150"
            >
              Crear mi primer PRD
              <DocumentPlusIcon className="ml-2 -mr-1 h-5 w-5" />
            </Link>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {prds.map((prd) => (
            <li key={prd.id} className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <Link 
                    href={`/prd/${prd.id}`}
                    className="block hover:bg-gray-50 transition-colors duration-150 p-4 rounded-lg -m-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-1">
                          {prd.title}
                        </h2>
                        <p className="text-sm text-gray-500">
                          Creado el {format(new Date(prd.createdAt), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handleDelete(prd.id, prd.title)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-150 rounded-full hover:bg-gray-100"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PRDList; 