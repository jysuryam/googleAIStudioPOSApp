import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  RotateCw,
  Crop,
  Check,
  X,
  Sliders,
  Image as ImageIcon,
  ZoomIn,
} from 'lucide-react';

interface ProductImageEditorModalProps {
  isOpen: boolean;
  initialImageUrl?: string;
  onClose: () => void;
  onSaveImage: (processedImageDataUrl: string, originalFilename: string) => void;
}

export const ProductImageEditorModal: React.FC<ProductImageEditorModalProps> = ({
  isOpen,
  initialImageUrl,
  onClose,
  onSaveImage,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImageUrl || null);
  const [rotation, setRotation] = useState<number>(0);
  const [aspectRatioMode, setAspectRatioMode] = useState<'free' | '1:1' | '4:3'>('4:3');
  const [compressionQuality, setCompressionQuality] = useState<number>(0.85);
  const [maxDimension, setMaxDimension] = useState<number>(800);
  const [filename, setFilename] = useState<string>('product_image.jpg');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (initialImageUrl) {
      setImageSrc(initialImageUrl);
    }
  }, [initialImageUrl]);

  if (!isOpen) return null;

  // Handle file select (from file dialog or camera capture)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPEG, PNG, and WebP images are supported.');
      return;
    }

    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
      setRotation(0);
    };
    reader.readAsDataURL(file);
  };

  // Rotate 90 degrees clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Process, crop/resize and compress using Canvas
  const handleApplyAndSave = () => {
    if (!imageSrc) return;
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isRotatedOrthogonal = rotation === 90 || rotation === 270;
      let naturalWidth = isRotatedOrthogonal ? img.height : img.width;
      let naturalHeight = isRotatedOrthogonal ? img.width : img.height;

      // Aspect ratio cropping bounds calculation
      let cropW = naturalWidth;
      let cropH = naturalHeight;

      if (aspectRatioMode === '1:1') {
        const minDim = Math.min(naturalWidth, naturalHeight);
        cropW = minDim;
        cropH = minDim;
      } else if (aspectRatioMode === '4:3') {
        const targetRatio = 4 / 3;
        if (naturalWidth / naturalHeight > targetRatio) {
          cropW = naturalHeight * targetRatio;
          cropH = naturalHeight;
        } else {
          cropW = naturalWidth;
          cropH = naturalWidth / targetRatio;
        }
      }

      // Max dimension downscale
      let finalW = cropW;
      let finalH = cropH;
      if (finalW > maxDimension || finalH > maxDimension) {
        if (finalW > finalH) {
          finalH = Math.round((finalH * maxDimension) / finalW);
          finalW = maxDimension;
        } else {
          finalW = Math.round((finalW * maxDimension) / finalH);
          finalH = maxDimension;
        }
      }

      canvas.width = finalW;
      canvas.height = finalH;

      ctx.clearRect(0, 0, finalW, finalH);
      ctx.save();

      // Transform for rotation and center
      ctx.translate(finalW / 2, finalH / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      const drawScale = finalW / cropW;
      const srcW = isRotatedOrthogonal ? img.height : img.width;
      const srcH = isRotatedOrthogonal ? img.width : img.height;

      ctx.drawImage(
        img,
        -img.width * drawScale * 0.5,
        -img.height * drawScale * 0.5,
        img.width * drawScale,
        img.height * drawScale
      );
      ctx.restore();

      const outputDataUrl = canvas.toDataURL('image/jpeg', compressionQuality);
      setIsProcessing(false);
      onSaveImage(outputDataUrl, filename);
    };

    img.src = imageSrc;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Product Image Studio & Optimizer
              </h2>
              <p className="text-xs text-slate-500">
                Upload, rotate, crop ratio, and compress for fast POS loading
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Canvas / Preview */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-slate-100/70 min-h-[300px]">
          {imageSrc ? (
            <div className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden p-2 bg-white shadow-sm flex items-center justify-center max-h-[340px]">
              <img
                src={imageSrc}
                alt="Upload preview"
                className="max-h-[300px] object-contain transition-transform duration-200"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
            </div>
          ) : (
            <div className="text-center p-8 bg-white border-2 border-dashed border-slate-300 rounded-xl w-full max-w-md">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No image loaded yet</p>
              <p className="text-[11px] text-slate-400 mt-1 mb-4">
                Select a photo from device or snap with phone camera
              </p>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose File</span>
                </button>
              </div>
            </div>
          )}

          {/* Hidden File Input (supports camera capture on mobile) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Controls Toolbar */}
        {imageSrc && (
          <div className="p-4 border-t border-slate-200 bg-white space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Aspect Ratio Buttons */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-medium mr-1">Crop Ratio:</span>
                {(['4:3', '1:1', 'free'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAspectRatioMode(mode)}
                    className={`px-2.5 py-1 rounded font-medium ${
                      aspectRatioMode === mode
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Rotate Tool */}
              <button
                type="button"
                onClick={handleRotate}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-1.5"
              >
                <RotateCw className="w-4 h-4" />
                <span>Rotate 90° ({rotation}°)</span>
              </button>

              {/* Replace Image Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-medium"
              >
                Change File...
              </button>
            </div>

            {/* Quality & Max Dimension Sliders */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Compression Quality:</span>
                  <span className="font-mono">{Math.round(compressionQuality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={compressionQuality}
                  onChange={(e) => setCompressionQuality(parseFloat(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Max Width/Height:</span>
                  <span className="font-mono">{maxDimension}px</span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="1200"
                  step="100"
                  value={maxDimension}
                  onChange={(e) => setMaxDimension(parseInt(e.target.value, 10))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyAndSave}
            disabled={!imageSrc || isProcessing}
            className={`px-5 py-2 text-xs font-semibold text-white rounded-lg shadow-xs flex items-center gap-1.5 ${
              !imageSrc || isProcessing
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Save & Attach to Product</span>
          </button>
        </div>
      </div>
    </div>
  );
};
