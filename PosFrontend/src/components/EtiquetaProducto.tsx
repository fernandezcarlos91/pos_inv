import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export interface EtiquetaProductoProps {
  producto: {
    Nombre: string;
    CodigoBarras: string;
    PrecioVenta: number;
  };
  tamano?: '58mm' | '80mm';
  nombreNegocio?: string;
  className?: string;
}

export const BarcodeSvg: React.FC<{
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
}> = ({ value, width = 1.5, height = 40, fontSize = 12 }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue: true,
          font: 'monospace',
          fontSize,
          textMargin: 2,
          margin: 4,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (err) {
        console.error('Error al generar código de barras con JsBarcode:', err);
      }
    }
  }, [value, width, height, fontSize]);

  return <svg ref={svgRef} className="max-w-full mx-auto block" />;
};

export const EtiquetaProducto: React.FC<EtiquetaProductoProps> = ({
  producto,
  tamano = '58mm',
  nombreNegocio = 'El Rinconcito de Emiliano',
  className = '',
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const is80 = tamano === '80mm';
  const widthMm = is80 ? '80mm' : '58mm';

  return (
    <div
      className={`etiqueta-producto-card text-black bg-white border border-gray-300 rounded-sm text-center flex flex-col justify-between items-center ${className}`}
      style={{
        width: widthMm,
        maxWidth: widthMm,
        minHeight: is80 ? '48mm' : '42mm',
        padding: is80 ? '3mm 4mm' : '2.5mm 3mm',
        boxSizing: 'border-box',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* Encabezado / Comercio */}
      {nombreNegocio && (
        <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-600 truncate max-w-full mb-0.5">
          {nombreNegocio}
        </div>
      )}

      {/* Nombre del Producto */}
      <div
        className="font-bold text-gray-900 leading-tight w-full break-words px-1"
        style={{ fontSize: is80 ? '13px' : '11.5px', maxHeight: '2.6em', overflow: 'hidden' }}
        title={producto.Nombre}
      >
        {producto.Nombre}
      </div>

      {/* Código de Barras (JsBarcode) con número debajo */}
      <div className="my-1 w-full flex justify-center items-center overflow-hidden">
        <BarcodeSvg
          value={producto.CodigoBarras}
          width={is80 ? 1.6 : 1.35}
          height={is80 ? 42 : 36}
          fontSize={is80 ? 12 : 11}
        />
      </div>

      {/* Precio de Venta Prominente */}
      <div className="w-full pt-0.5 border-t border-dashed border-gray-400">
        <div className="text-[10px] text-gray-500 font-medium leading-none mb-0.5">
          PRECIO DE VENTA
        </div>
        <div
          className="font-black text-black leading-none tracking-tight"
          style={{ fontSize: is80 ? '19px' : '16px' }}
        >
          {formatCurrency(producto.PrecioVenta)}
        </div>
      </div>
    </div>
  );
};

export default EtiquetaProducto;
