
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const BUCKET = 'item-images';

/**
 * Upload an image file to Supabase Storage
 * Returns the public URL on success, null on error
 */
export const uploadImage = async (
    file: File,
    folder: string = 'listings'
): Promise<string | null> => {
    if (!isSupabaseConfigured) {
        console.warn('Supabase not configured — skipping upload');
        return null;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        console.error('Upload error:', error);
        return null;
    }

    return getPublicUrl(fileName);
};

/**
 * Upload multiple images. Returns array of public URLs (skipping failures).
 */
export const uploadImages = async (
    files: File[],
    folder: string = 'listings',
    onProgress?: (completed: number, total: number) => void
): Promise<string[]> => {
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i], folder);
        if (url) urls.push(url);
        onProgress?.(i + 1, files.length);
    }
    return urls;
};

/**
 * Get the public URL for a file path in storage
 */
export const getPublicUrl = (path: string): string => {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
};

/**
 * Delete an image from storage by its public URL
 */
export const deleteImage = async (publicUrl: string): Promise<boolean> => {
    // Extract path from public URL
    const parts = publicUrl.split(`/storage/v1/object/public/${BUCKET}/`);
    if (parts.length < 2) return false;

    const path = parts[1];
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
        console.error('Delete error:', error);
        return false;
    }
    return true;
};

/**
 * Compress/resize an image client-side before upload
 * Returns a new File object
 */
export const compressImage = (
    file: File,
    maxWidth = 1200,
    quality = 0.85
): Promise<File> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                        } else {
                            resolve(file); // fallback to original
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
};
