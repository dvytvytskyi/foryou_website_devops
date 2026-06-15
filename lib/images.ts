

export function getOptimizedImageUrl(url: string, width: number = 800): string {
    if (!url) return '';

    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
        const parts = url.split('/upload/');

        return `${parts[0]}/upload/f_auto,q_auto:good,w_${width}/${parts[1]}`;
    }


    return url;
}
