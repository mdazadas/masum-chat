export const compressImage = async (file: File | Blob, maxWidthOrHeight: number = 1080): Promise<File | Blob> => {
    // Return original if it's not an image or already small enough
    if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.size / 1024 / 1024 < 0.2) {
        return file;
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidthOrHeight) {
                        height = Math.round(height * (maxWidthOrHeight / width));
                        width = maxWidthOrHeight;
                    }
                } else {
                    if (height > maxWidthOrHeight) {
                        width = Math.round(width * (maxWidthOrHeight / height));
                        height = maxWidthOrHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file); // fallback
                    return;
                }

                // Fill with white in case of transparency to jpeg conversion
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // Start at 0.8 quality
                let quality = 0.8;
                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve(file);
                        return;
                    }
                    
                    // If it's still bigger than maxSizeMB, we can compress more, but doing it once recursively is enough for most cases
                    // For simplicity, we just return the compressed one. 
                    // This typically achieves 70-90% reduction on large photos.
                        const newFile = new File([blob], (file as File).name || 'compressed_image.jpg', {
                            type: file.type,
                            lastModified: Date.now(),
                        });
                    
                    resolve(newFile);
                }, 'image/jpeg', quality);
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
};
