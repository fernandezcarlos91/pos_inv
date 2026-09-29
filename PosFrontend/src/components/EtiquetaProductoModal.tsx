import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Tag, Minus, Plus } from 'lucide-react';
import type { ProductoResponseDto } from '../DTOs/ProductoResponseDto';
import { EtiquetaProducto } from './EtiquetaProducto';

interface EtiquetaProductoModalProps {
  producto: ProductoResponseDto | null;
  isOpen: boolean;
  onClose: () => void;
  nombreNegocio?: string;
}

export const EtiquetaProductoModal: React.FC<EtiquetaProductoModalProps> = ({
  producto,
  isOpen,
  onClose,
  nombreNegocio = 'El Rinconcito de Emiliano',
}) => {
  const [tamano, setTamano] = useState<'58mm' | '80mm'>('58mm');
  const [copias, setCopias] = useState<number>(1);

  if (!isOpen || !producto) return null;

  const handlePrint = () => {
    // Aplicar clase para configurar tamaño de página si corresponde
    document.body.classList.add(tamano === '80mm' ? 'printing-etiqueta-80' : 'printing-etiqueta-58');
    
    // Disparar ventana de impresión nativa
    window.print();

    // Limpiar clases al finalizar o después de un breve delay
    const cleanup = () => {
      document.body.classList.remove('printing-etiqueta-58', 'printing-etiqueta-80');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 1500);
  };

  const incrementarCopias = () => setCopias(c => Math.min(c + 1, 50));
  const decrementarCopias = () => setCopias(c => Math.max(c - 1, 1));

  return (
    <>
      {/* Modal interactivo en pantalla */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in no-print">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden flex flex-col max-h-[95vh]">
          {/* Encabezado */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  Imprimir Etiqueta de Producto
                </h3>
                <p className="text-xs text-gray-500 truncate max-w-[220px] sm:max-w-xs">
                  {producto.Nombre}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Área de Vista Previa */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100 flex flex-col items-center justify-center">
            <span className="text-[11px] font-medium text-gray-500 mb-3">
              Vista previa de la etiqueta ({tamano})
            </span>

            {/* Simulación física de la etiqueta */}
            <div className="bg-white p-2 rounded shadow-md border border-gray-200 inline-block transition-all">
              <EtiquetaProducto
                producto={producto}
                tamano={tamano}
                nombreNegocio={nombreNegocio}
              />
            </div>
          </div>

          {/* Controles de Configuración */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-white space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Selector de Tamaño */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Ancho de papel
                </label>
                <select
                  value={tamano}
                  onChange={(e) => setTamano(e.target.value as '58mm' | '80mm')}
                  className="w-full text-xs px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="58mm">58mm (Etiqueta compacta)</option>
                  <option value="80mm">80mm (Rollo estándar)</option>
                </select>
              </div>

              {/* Selector de Copias */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Cantidad de etiquetas
                </label>
                <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={decrementarCopias}
                    className="p-2 hover:bg-gray-200 text-gray-600 transition-colors"
                    title="Disminuir copias"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={copias}
                    onChange={(e) => setCopias(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                    className="w-full text-center text-xs font-bold bg-transparent border-0 focus:outline-none focus:ring-0 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={incrementarCopias}
                    className="p-2 hover:bg-gray-200 text-gray-600 transition-colors"
                    title="Aumentar copias"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-300 transition-colors shadow-2xs"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Imprimir {copias > 1 ? `(${copias} etiquetas)` : 'etiqueta'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor aislado para impresión física mediante Portal */}
      {createPortal(
        <div id="etiqueta-print-root">
          {Array.from({ length: copias }).map((_, i) => (
            <div key={i} className="etiqueta-item-print">
              <EtiquetaProducto
                producto={producto}
                tamano={tamano}
                nombreNegocio={nombreNegocio}
              />
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

export default EtiquetaProductoModal;
