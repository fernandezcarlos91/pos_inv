import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, CheckCircle } from 'lucide-react';
import type { VentaResponseDto } from '../DTOs/VentaDto';
import { TicketTermico } from './TicketTermico';
import { useAuth } from '../context/AuthContext';

interface TicketVentaModalProps {
  venta: VentaResponseDto | null;
  isOpen: boolean;
  onClose: () => void;
  autoPrint?: boolean;
}

const STORAGE_KEY_AUTO_PRINT = 'pos_auto_print_ticket';

export const TicketVentaModal: React.FC<TicketVentaModalProps> = ({
  venta,
  isOpen,
  onClose,
  autoPrint = false,
}) => {
  const { usuario } = useAuth();
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_AUTO_PRINT) === 'true';
  });

  const toggleAutoPrint = (checked: boolean) => {
    setAutoPrintEnabled(checked);
    localStorage.setItem(STORAGE_KEY_AUTO_PRINT, checked ? 'true' : 'false');
  };

  const handlePrint = () => {
    window.print();
  };

  // Disparar impresión automática si está configurado o si se solicitó explícitamente
  useEffect(() => {
    if (isOpen && venta && (autoPrint || autoPrintEnabled)) {
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, venta, autoPrint, autoPrintEnabled]);

  if (!isOpen || !venta) return null;

  const cajeroNombre = venta.NombreUsuario || usuario?.nombre || 'Cajero';

  return (
    <>
      {/* Modal en pantalla (visible sólo en pantalla normal, oculto en impresión vía CSS) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in no-print">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden flex flex-col max-h-[95vh]">
          {/* Encabezado del Modal */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  Ticket de Venta #{venta.Id}
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Exitosa
                  </span>
                </h3>
                <p className="text-xs text-gray-500">
                  Listo para impresora térmica de 80mm
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

          {/* Área de Vista Previa del Ticket (simulación de papel de 80mm) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-gray-100/80 flex flex-col items-center justify-start">
            <div className="text-[11px] font-medium text-gray-500 mb-2 flex items-center gap-1.5 self-center">
              <span>Vista previa del ticket (ancho real 80mm)</span>
            </div>

            {/* Simulación física del ticket con sombra de papel */}
            <div className="bg-white px-3 py-4 rounded-sm shadow-md border border-gray-200/80 transition-shadow">
              <TicketTermico
                venta={venta}
                nombreCajeroFallback={cajeroNombre}
                isPrintVersion={false}
              />
            </div>
          </div>

          {/* Opciones y Botones de Acción */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-white space-y-3">
            {/* Toggle de Auto-Impresión */}
            <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-200/60">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoPrintEnabled}
                  onChange={(e) => toggleAutoPrint(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <span className="font-medium text-gray-700">
                  Imprimir automáticamente al completar venta
                </span>
              </label>
              <span className="text-[10px] text-gray-400 font-mono">80mm</span>
            </div>

            {/* Botones principales */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-300 transition-colors shadow-2xs"
              >
                Nueva Venta
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Imprimir ticket
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Portal directo en body para la impresión física real (@media print) */}
      {createPortal(
        <div id="ticket-termico-print">
          <TicketTermico
            venta={venta}
            nombreCajeroFallback={cajeroNombre}
            isPrintVersion={true}
          />
        </div>,
        document.body
      )}
    </>
  );
};

export default TicketVentaModal;
