import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Move, RefreshCw } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedBase64: string) => void;
  aspectRatio?: number; // width / height, default 3 / 4 = 0.75
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio = 3 / 4,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Kích thước khung cắt (Crop box) trên giao diện (tỉ lệ 3:4)
  const CROP_BOX_WIDTH = 270;
  const CROP_BOX_HEIGHT = Math.round(CROP_BOX_WIDTH / aspectRatio); // 360px (270 / 0.75 = 360)

  // Reset trạng thái khi đổi ảnh hoặc mở modal
  useEffect(() => {
    if (isOpen && imageSrc) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    setOffset({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Xử lý touch trên thiết bị di động
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Xoay 90 độ
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Đặt lại
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Xuất ảnh cắt tỉ lệ 3:4 chất lượng cao
  const handleCrop = () => {
    if (!imageRef.current || !imageSize.width || !imageSize.height) return;

    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    // Xuất kích thước chuẩn 900x1200 (tỉ lệ 3:4)
    const exportWidth = 900;
    const exportHeight = 1200;
    canvas.width = exportWidth;
    canvas.height = exportHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Tô nền trắng
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    // Tỉ lệ scale giữa khung hiển thị và canvas xuất
    const scaleFactor = exportWidth / CROP_BOX_WIDTH;

    ctx.save();
    // Di chuyển gốc tọa độ về tâm khung cắt trên canvas
    ctx.translate(exportWidth / 2, exportHeight / 2);

    // Áp dụng xoay
    ctx.rotate((rotation * Math.PI) / 180);

    // Áp dụng độ dời và zoom
    const drawOffsetX = offset.x * scaleFactor;
    const drawOffsetY = offset.y * scaleFactor;

    // Tính kích thước hiển thị cơ sở của ảnh để vừa khung 3:4
    // (ảnh được render trong khung với object-contain theo CROP_BOX_WIDTH / CROP_BOX_HEIGHT)
    let baseDisplayW = CROP_BOX_WIDTH;
    let baseDisplayH = (CROP_BOX_WIDTH / imageSize.width) * imageSize.height;

    // Nếu ảnh dọc quá, căn theo chiều cao
    if (baseDisplayH < CROP_BOX_HEIGHT) {
      baseDisplayH = CROP_BOX_HEIGHT;
      baseDisplayW = (CROP_BOX_HEIGHT / imageSize.height) * imageSize.width;
    }

    const finalW = baseDisplayW * zoom * scaleFactor;
    const finalH = baseDisplayH * zoom * scaleFactor;

    ctx.drawImage(
      img,
      drawOffsetX - finalW / 2,
      drawOffsetY - finalH / 2,
      finalW,
      finalH
    );

    ctx.restore();

    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.95);
    onCropComplete(croppedBase64);
    onClose();
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 text-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <span>Cắt Ảnh Mã QR (Tỉ Lệ Chuẩn 3:4)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Kéo di chuyển ảnh và chỉnh thu/phóng sao cho mã QR nằm gọn trong khung
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Khu vực cắt ảnh (Crop Viewport) */}
        <div
          ref={containerRef}
          className="relative w-full h-[400px] sm:h-[430px] bg-black/90 flex items-center justify-center overflow-hidden select-none cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Ảnh gốc được biến đổi bởi offset, zoom và xoay */}
          <div
            className="absolute transition-transform duration-75 pointer-events-none will-change-transform"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            }}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Ảnh gốc cần cắt"
              onLoad={handleImageLoad}
              className="max-w-none pointer-events-none"
              style={{
                width: `${CROP_BOX_WIDTH}px`,
                height: 'auto',
                minHeight: `${CROP_BOX_HEIGHT}px`,
                objectFit: 'contain',
              }}
              draggable={false}
            />
          </div>

          {/* Lớp phủ tối xung quanh khung 3:4 */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Khung cắt chính */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]"
              style={{
                width: `${CROP_BOX_WIDTH}px`,
                height: `${CROP_BOX_HEIGHT}px`,
              }}
            >
              {/* Lưới chia 3x3 hỗ trợ căn chỉnh bố cục */}
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                <div className="border-r border-b border-emerald-300/60" />
                <div className="border-r border-b border-emerald-300/60" />
                <div className="border-b border-emerald-300/60" />
                <div className="border-r border-b border-emerald-300/60" />
                <div className="border-r border-b border-emerald-300/60" />
                <div className="border-b border-emerald-300/60" />
                <div className="border-r border-emerald-300/60" />
                <div className="border-r border-emerald-300/60" />
                <div />
              </div>

              {/* Badge tỉ lệ 3:4 */}
              <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-emerald-500/90 text-slate-950 font-bold font-mono text-[10px] rounded">
                TỈ LỆ 3:4
              </div>

              {/* Hướng dẫn thao tác */}
              <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/75 text-emerald-300 text-[10px] rounded flex items-center gap-1 backdrop-blur-xs">
                <Move className="w-3 h-3" />
                <span>Kéo để căn giữa</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thanh công cụ điều khiển Zoom & Xoay */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1 shrink-0">
              <ZoomIn className="w-3.5 h-3.5" /> Thu / Phóng:
            </span>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(0.6, Number((prev - 0.1).toFixed(2))))}
              className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min="0.6"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-emerald-500 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3, Number((prev + 0.1).toFixed(2))))}
              className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-emerald-400 w-10 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Xoay 90 độ"
              >
                <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Xoay 90°</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Đặt lại vị trí ban đầu"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Đặt Lại</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleCrop}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Cắt &amp; Áp Dụng (3:4)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
