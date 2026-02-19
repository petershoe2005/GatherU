
import React, { useState, useRef } from 'react';
import { compressImage, uploadImages } from '../services/storageService';

interface ImageUploaderProps {
    images: string[];
    onImagesChange: (urls: string[]) => void;
    maxImages?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ images, onImagesChange, maxImages = 5 }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = async (fileList: FileList | File[]) => {
        const files = Array.from(fileList).slice(0, maxImages - images.length);
        if (files.length === 0) return;

        setUploading(true);
        setProgress({ done: 0, total: files.length });

        // Compress all files first
        const compressed = await Promise.all(
            files.map(f => compressImage(f, 1200, 0.85))
        );

        // Upload with progress tracking
        const newUrls = await uploadImages(compressed, 'listings', (done, total) => {
            setProgress({ done, total });
        });

        if (newUrls.length > 0) {
            onImagesChange([...images, ...newUrls]);
        } else {
            alert('Image upload failed. Please try again.');
        }

        setUploading(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleRemove = (index: number) => {
        onImagesChange(images.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                {/* Existing Images */}
                {images.map((url, idx) => (
                    <div key={idx} className="flex-shrink-0 w-32 h-32 rounded-xl bg-slate-100 dark:bg-slate-800 relative group overflow-hidden">
                        <img className="w-full h-full object-cover" src={url} alt={`Photo ${idx + 1}`} />
                        <button
                            onClick={() => handleRemove(idx)}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <span className="material-icons-round text-xs">close</span>
                        </button>
                        {idx === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-slate-900 text-[9px] font-bold text-center py-0.5 uppercase tracking-wider">
                                Cover
                            </div>
                        )}
                    </div>
                ))}

                {/* Add Button / Drop Zone */}
                {images.length < maxImages && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`flex-shrink-0 w-32 h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging
                                ? 'border-primary bg-primary/10 text-primary scale-105'
                                : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:border-primary hover:text-primary'
                            }`}
                    >
                        {uploading ? (
                            <>
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-[10px] mt-1 font-semibold">{progress.done}/{progress.total}</span>
                            </>
                        ) : (
                            <>
                                <span className="material-icons-round text-3xl">add_a_photo</span>
                                <span className="text-[10px] mt-1 font-semibold uppercase tracking-wider">
                                    {images.length === 0 ? 'Add Photos' : 'Add More'}
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <p className="text-[11px] text-slate-500 px-1">
                {images.length}/{maxImages} photos • Tap to add, drag to reorder
            </p>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
        </div>
    );
};

export default ImageUploader;
