import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OptimizedImage, { generateBlurDataURL } from '../OptimizedImage';

// Mock LazyLoader component
jest.mock('../LazyLoader', () => {
  return function MockLazyLoader({ children, fallback }: any) {
    return <div data-testid="lazy-loader">{children}</div>;
  };
});

describe('OptimizedImage', () => {
  it('should render image with basic props', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={800}
        height={600}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test-image.jpg');
    expect(img).toHaveAttribute('width', '800');
    expect(img).toHaveAttribute('height', '600');
  });

  it('should generate srcSet for responsive images', () => {
    render(<OptimizedImage src="/test-image.jpg" alt="Test image" />);

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('srcset');

    const srcSet = img.getAttribute('srcset');
    expect(srcSet).toContain('/test-image.jpg 320w');
    expect(srcSet).toContain('/test-image.jpg 640w');
    expect(srcSet).toContain('/test-image.jpg 1920w');
  });

  it('should use lazy loading by default', () => {
    render(<OptimizedImage src="/test-image.jpg" alt="Test image" />);

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('should use eager loading when priority is true', () => {
    render(
      <OptimizedImage src="/test-image.jpg" alt="Test image" priority={true} />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('should not use LazyLoader when priority is true', () => {
    const { container } = render(
      <OptimizedImage src="/test-image.jpg" alt="Test image" priority={true} />
    );

    expect(
      container.querySelector('[data-testid="lazy-loader"]')
    ).not.toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    render(<OptimizedImage src="/test-image.jpg" alt="Test image" />);

    expect(screen.getByText('Loading image...')).toBeInTheDocument();
  });

  it('should handle image load event', async () => {
    render(<OptimizedImage src="/test-image.jpg" alt="Test image" />);

    const img = screen.getByAltText('Test image');

    // Initially should have opacity-0
    expect(img).toHaveClass('opacity-0');

    // Simulate image load
    fireEvent.load(img);

    await waitFor(() => {
      expect(img).toHaveClass('opacity-100');
    });

    expect(screen.queryByText('Loading image...')).not.toBeInTheDocument();
  });

  it('should handle image error', async () => {
    render(<OptimizedImage src="/broken-image.jpg" alt="Test image" />);

    const img = screen.getByAltText('Test image');

    // Simulate image error
    fireEvent.error(img);

    await waitFor(() => {
      expect(screen.getByText('Image failed to load')).toBeInTheDocument();
    });

    expect(screen.getByText('🖼️')).toBeInTheDocument();
  });

  it('should show blur placeholder when specified', () => {
    const { container } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,test"
      />
    );

    const placeholder = container.querySelector('[style*="blur"]');
    expect(placeholder).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        className="custom-image-class"
      />
    );

    expect(container.querySelector('.custom-image-class')).toBeInTheDocument();
  });

  it('should set proper sizes attribute', () => {
    render(<OptimizedImage src="/test-image.jpg" alt="Test image" />);

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute(
      'sizes',
      '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
    );
  });

  it('should set decoding to async', () => {
    render(<OptimizedImage src="/test-image.jpg" alt="Test image" />);

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('decoding', 'async');
  });

  it('should handle empty placeholder', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        placeholder="empty"
      />
    );

    // Should not show blur placeholder
    const { container } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        placeholder="empty"
      />
    );

    const placeholder = container.querySelector('[style*="blur"]');
    expect(placeholder).not.toBeInTheDocument();
  });
});

describe('generateBlurDataURL', () => {
  // Mock canvas and context
  const mockCanvas = {
    width: 0,
    height: 0,
    getContext: jest.fn(),
    toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
  };

  const mockContext = {
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    fillRect: jest.fn(),
    fillStyle: '',
  };

  beforeEach(() => {
    // Mock document.createElement for canvas
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return mockCanvas as any;
      }
      return document.createElement(tagName);
    });

    mockCanvas.getContext.mockReturnValue(mockContext);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should generate blur data URL with default dimensions', () => {
    const result = generateBlurDataURL();

    expect(mockCanvas.width).toBe(10);
    expect(mockCanvas.height).toBe(10);
    expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    expect(mockContext.createLinearGradient).toHaveBeenCalledWith(0, 0, 10, 10);
    expect(mockCanvas.toDataURL).toHaveBeenCalled();
    expect(result).toBe('data:image/png;base64,mock');
  });

  it('should generate blur data URL with custom dimensions', () => {
    generateBlurDataURL(20, 15);

    expect(mockCanvas.width).toBe(20);
    expect(mockCanvas.height).toBe(15);
    expect(mockContext.createLinearGradient).toHaveBeenCalledWith(0, 0, 20, 15);
  });

  it('should handle context creation failure', () => {
    mockCanvas.getContext.mockReturnValue(null);

    const result = generateBlurDataURL();

    expect(result).toBe('');
  });
});
