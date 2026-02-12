'use client';

import { useState } from 'react';
import LazyLoader from './LazyLoader';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

/**
 * OptimizedImage component that provides lazy loading and optimization
 * Since we're using static export, we handle optimization manually
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // Generate responsive srcSet for different screen sizes
  const generateSrcSet = (baseSrc: string) => {
    const sizes = [320, 640, 768, 1024, 1280, 1920];
    return sizes
      .map((size) => {
        // For static export, we assume images are already optimized
        // In a real implementation, you might use a service like Cloudinary
        return `${baseSrc} ${size}w`;
      })
      .join(', ');
  };

  const imageElement = (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder/blur effect */}
      {!isLoaded && placeholder === 'blur' && (
        <div
          className="absolute inset-0 bg-terminal-bg/20 animate-pulse"
          style={{
            backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(10px)',
          }}
        />
      )}

      {/* Error state */}
      {hasError ? (
        <div className="flex items-center justify-center bg-terminal-bg/20 text-terminal-fg/50 p-4 border border-terminal-border rounded">
          <span className="text-2xl mr-2">🖼️</span>
          <span>Image failed to load</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          srcSet={generateSrcSet(src)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`
            transition-opacity duration-300
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${className}
          `}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      )}

      {/* Loading indicator */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-terminal-bg/10">
          <div className="text-terminal-fg/50 animate-pulse">
            Loading image...
          </div>
        </div>
      )}
    </div>
  );

  // Use lazy loading unless priority is set
  if (priority) {
    return imageElement;
  }

  return (
    <LazyLoader
      fallback={
        <div className="bg-terminal-bg/20 animate-pulse rounded border border-terminal-border p-8 text-center text-terminal-fg/50">
          🖼️ Loading image...
        </div>
      }
    >
      {imageElement}
    </LazyLoader>
  );
}

/**
 * Utility function to generate blur data URL for placeholder
 */
export function generateBlurDataURL(
  width: number = 10,
  height: number = 10
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Create a simple gradient blur effect
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(20, 20, 20, 0.8)');
  gradient.addColorStop(1, 'rgba(40, 40, 40, 0.6)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL();
}
