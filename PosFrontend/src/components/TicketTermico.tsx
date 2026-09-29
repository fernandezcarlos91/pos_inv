import React from 'react';
import type { VentaResponseDto } from '../DTOs/VentaDto';

interface TicketTermicoProps {
  venta: VentaResponseDto;
  nombreCajeroFallback?: string;
  nombreNegocio?: string;
  className?: string;
  isPrintVersion?: boolean;
}

/**
 * Formatea una fecha ISO o string a formato legible en tickets: DD/MM/AAAA HH:mm:ss
 */
const formatTicketDate = (fechaStr?: string | Date): string => {
  if (!fechaStr) return '';
  const d = typeof fechaStr === 'string' ? new Date(fechaStr) : fechaStr;
  if (isNaN(d.getTime())) return String(fechaStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dia = pad(d.getDate());
  const mes = pad(d.getMonth() + 1);
  const anio = d.getFullYear();
  const horas = pad(d.getHours());
  const minutos = pad(d.getMinutes());
  const segundos = pad(d.getSeconds());
  return `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos}`;
};

const formatTicketCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Componente de Ticket Térmico estándar para papel de 80mm (~302px)
 * Diseñado con tipografía monoespaciada de alto contraste, sin fondos de color innecesarios.
 */
export const TicketTermico: React.FC<TicketTermicoProps> = ({
  venta,
  nombreCajeroFallback = 'Cajero',
  nombreNegocio = 'El Rinconcito de Emiliano',
  className = '',
  isPrintVersion = false,
}) => {
  const cajero = venta.NombreUsuario || nombreCajeroFallback;
  const detalles = venta.Detalles || [];
  const totalArticulos = detalles.reduce((acc, d) => acc + (d.Cantidad || 0), 0);
  const tieneDescuento = Boolean(venta.Descuento && Number(venta.Descuento) > 0);
  const totalBruto = venta.TotalBruto && Number(venta.TotalBruto) > 0 
    ? Number(venta.TotalBruto) 
    : (tieneDescuento ? Number(venta.Total) + Number(venta.Descuento || 0) : Number(venta.Total));

  return (
    <div
      className={`ticket-termico-root text-black bg-white text-xs select-none ${className}`}
      style={{
        width: '80mm',
        maxWidth: '80mm',
        boxSizing: 'border-box',
        fontFamily: "'Courier New', Courier, 'Lucida Console', monospace",
        lineHeight: 1.25,
      }}
    >
      {/* Encabezado del Comercio */}
      <div className="text-center pb-2">
        <h1 className="text-base font-black tracking-tight uppercase leading-tight mb-1 text-black">
          {nombreNegocio}
        </h1>
        <p className="text-[11px] font-semibold text-gray-800 tracking-wide">
          Punto de Venta e Inventario
        </p>
      </div>

      {/* Línea divisoria punteada */}
      <div className="border-b border-dashed border-black my-1.5" />

      {/* Metadatos de la Venta */}
      <div className="space-y-0.5 text-[11px]">
        <div className="flex justify-between font-bold text-black">
          <span>TICKET VENTA:</span>
          <span>#{String(venta.Id).padStart(6, '0')}</span>
        </div>
        <div className="flex justify-between text-black">
          <span>FECHA:</span>
          <span>{formatTicketDate(venta.Fecha)}</span>
        </div>
        <div className="flex justify-between text-black">
          <span>CAJERO:</span>
          <span className="font-semibold truncate max-w-[170px] text-right">{cajero}</span>
        </div>
      </div>

      {/* Encabezado de la lista de productos */}
      <div className="border-b border-dashed border-black my-1.5" />
      <div className="flex justify-between text-[11px] font-bold pb-0.5 text-black">
        <span>CANT × PRODUCTO</span>
        <span>SUBTOTAL</span>
      </div>
      <div className="border-b border-dashed border-black mb-1.5" />

      {/* Lista de Productos: cantidad × nombre × precio unitario → subtotal */}
      <div className="space-y-1.5">
        {detalles.length === 0 ? (
          <div className="text-center text-gray-500 py-2">Sin productos registrados</div>
        ) : (
          detalles.map((d, index) => {
            const nombreProd = d.NombreProducto || `Producto #${d.ProductoId}`;
            return (
              <div key={d.Id || index} className="text-[11px] leading-tight">
                <div className="font-bold text-black break-words">
                  {nombreProd}
                </div>
                <div className="flex justify-between items-center text-black mt-0.5 pl-1">
                  <span>
                    {d.Cantidad} × {formatTicketCurrency(d.PrecioUnitario)}
                  </span>
                  <span className="font-bold">
                    {formatTicketCurrency(d.Subtotal)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resumen y Forma de Pago */}
      <div className="border-b border-dashed border-black my-2" />
      
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between text-black">
          <span>Artículos ({detalles.length} líneas):</span>
          <span className="font-semibold">{totalArticulos} un.</span>
        </div>
        <div className="flex justify-between text-black">
          <span>Forma de Pago:</span>
          <span className="font-bold uppercase">{venta.FormaPago || 'Efectivo'}</span>
        </div>
      </div>

      {/* Desglose de Descuento si aplica */}
      {tieneDescuento && (
        <div className="border-t border-dashed border-black mt-2 pt-1.5 space-y-1 text-[11px]">
          <div className="flex justify-between text-black">
            <span>SUBTOTAL BRUTO:</span>
            <span className="font-semibold">{formatTicketCurrency(totalBruto)}</span>
          </div>
          <div className="flex justify-between text-black font-bold">
            <span>DESCUENTO:</span>
            <span>-{formatTicketCurrency(venta.Descuento || 0)}</span>
          </div>
          {venta.MotivoDescuento && (
            <div className="text-[10px] text-gray-700 italic text-right truncate">
              ({venta.MotivoDescuento})
            </div>
          )}
        </div>
      )}

      {/* Total destacado */}
      <div className="border-t-2 border-dashed border-black my-2 pt-1.5 pb-1">
        <div className="flex justify-between items-baseline text-black">
          <span className="text-sm font-black tracking-wide">
            {tieneDescuento ? 'TOTAL A PAGAR:' : 'TOTAL:'}
          </span>
          <span className="text-base font-black tracking-tight">
            {formatTicketCurrency(venta.Total)}
          </span>
        </div>
      </div>
      <div className="border-b-2 border-dashed border-black mb-2" />

      {/* Pie de Página */}
      <div className="text-center pt-1 space-y-1 text-[11px]">
        <p className="font-bold text-xs uppercase tracking-wide text-black">
          ¡Gracias por su compra!
        </p>
        <p className="text-[10px] text-gray-700">
          {nombreNegocio} siempre a su servicio
        </p>
        <p className="text-[9px] text-gray-600 italic">
          Comprobante no válido como boleta fiscal
        </p>
      </div>

      {/* Margen inferior para que la cuchilla de corte de la impresora no corte el texto */}
      <div style={{ height: isPrintVersion ? '12mm' : '4mm' }} />
    </div>
  );
};

export default TicketTermico;
