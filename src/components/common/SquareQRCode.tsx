import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface SquareQRCodeProps {
  value: string;
  size?: number;
  className?: string;
  label?: string;
}

export const SquareQRCode: React.FC<SquareQRCodeProps> = ({
  value,
  size = 120,
  className = '',
  label,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!value) return;
    let isMounted = true;
    QRCode.toDataURL(value, {
      width: size * 2, // 2x for sharp printing & high-DPI displays
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate square QR code', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="Square QR Code"
          style={{ width: `${size}px`, height: `${size}px` }}
          className="aspect-square border border-slate-300 rounded bg-white p-1 shadow-2xs print:border-black"
        />
      ) : (
        <div
          style={{ width: `${size}px`, height: `${size}px` }}
          className="aspect-square border border-slate-300 rounded bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-mono"
        >
          Loading QR...
        </div>
      )}
      {label && <p className="text-[9px] text-slate-600 font-medium mt-1 text-center font-mono">{label}</p>}
    </div>
  );
};
