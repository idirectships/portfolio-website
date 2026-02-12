import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileSystemRouter from '../FileSystemRouter';
import { fileSystemService } from '../../services/FileSystemService';

// Mock the FileSystemService
jest.mock('../../services/FileSystemService', () => ({
  fileSystemService: {
    getFileSystemTree: jest.fn(),
  },
}));

const mockFileSystemService = fileSystemService as jest.Mocked<
  typeof fileSystemService
>;

const mockFileSystem = {
  name: '~',
  type: 'directory' as const,
  path: '~',
  children: [
    {
      name: 'artist',
      type: 'directory' as const,
      path: '~/artist',
      children: [
        {
          name: 'bio.md',
          type: 'file' as const,
          path: '~/artist/bio.md',
        },
      ],
    },
    {
      name: 'projects',
      type: 'directory' as const,
      path: '~/projects',
      children: [
        {
          name: 'web-apps',
          type: 'directory' as const,
          path: '~/projects/web-apps',
          children: [],
        },
      ],
    },
    {
      name: 'README.md',
      type: 'file' as const,
      path: '~/README.md',
    },
  ],
};

describe('FileSystemRouter', () => {
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileSystemService.getFileSystemTree.mockReturnValue(mockFileSystem);
  });

  it('should render loading state initially', () => {
    mockFileSystemService.getFileSystemTree.mockReturnValue(null);

    render(<FileSystemRouter currentPath="~" onNavigate={mockOnNavigate} />);

    expect(screen.getByText('Loading file system...')).toBeInTheDocument();
  });

  it('should render file system tree when loaded', async () => {
    render(<FileSystemRouter currentPath="~" onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('File System')).toBeInTheDocument();
    });

    expect(screen.getByText('artist/')).toBeInTheDocument();
    expect(screen.getByText('projects/')).toBeInTheDocument();
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });

  it('should show current path in header', async () => {
    render(
      <FileSystemRouter currentPath="~/artist" onNavigate={mockOnNavigate} />
    );

    await waitFor(() => {
      expect(screen.getByText('Current: ~/artist')).toBeInTheDocument();
    });
  });

  it('should handle directory navigation', async () => {
    render(<FileSystemRouter currentPath="~" onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('artist/')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('artist/'));

    expect(mockOnNavigate).toHaveBeenCalledWith('~/artist');
  });

  it('should expand/collapse directories', async () => {
    render(<FileSystemRouter currentPath="~" onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('artist/')).toBeInTheDocument();
    });

    // Initially collapsed, bio.md should not be visible
    expect(screen.queryByText('bio.md')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText('artist/'));

    await waitFor(() => {
      expect(screen.getByText('bio.md')).toBeInTheDocument();
    });
  });

  it('should show appropriate icons for different file types', async () => {
    render(<FileSystemRouter currentPath="~" onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('File System')).toBeInTheDocument();
    });

    // Check that directories have folder icons and files have document icons
    const artistElement = screen.getByText('artist/').closest('div');
    const readmeElement = screen.getByText('README.md').closest('div');

    expect(artistElement).toHaveTextContent('📁');
    expect(readmeElement).toHaveTextContent('📄');
  });

  it('should highlight current path', async () => {
    render(
      <FileSystemRouter currentPath="~/artist" onNavigate={mockOnNavigate} />
    );

    await waitFor(() => {
      expect(screen.getByText('artist/')).toBeInTheDocument();
    });

    const artistElement = screen.getByText('artist/').closest('div');
    expect(artistElement).toHaveClass(
      'bg-terminal-accent/20',
      'text-terminal-accent'
    );
  });

  it('should auto-expand path to current directory', async () => {
    render(
      <FileSystemRouter
        currentPath="~/artist/bio.md"
        onNavigate={mockOnNavigate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('bio.md')).toBeInTheDocument();
    });

    // The artist directory should be expanded to show bio.md
    expect(screen.getByText('bio.md')).toBeInTheDocument();
  });

  it('should handle file system loading failure', async () => {
    mockFileSystemService.getFileSystemTree.mockReturnValue(null);

    render(<FileSystemRouter currentPath="~" onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load file system')
      ).toBeInTheDocument();
    });
  });

  it('should show help text at bottom', async () => {
    render(<FileSystemRouter currentPath="~" onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Click directories to navigate/)
      ).toBeInTheDocument();
    });
  });

  it('should apply custom className', () => {
    const { container } = render(
      <FileSystemRouter
        currentPath="~"
        onNavigate={mockOnNavigate}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
