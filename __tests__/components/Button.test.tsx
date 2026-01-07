/**
 * Tests for components/ui/Button.tsx
 * Tests the Button component's variants, sizes, and states
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => (
    <span data-testid="loading-spinner" className={className}>Loading...</span>
  ),
}));

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render children correctly', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should render as a button element', () => {
      render(<Button>Test</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should default to type="button"', () => {
      render(<Button>Test</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('should allow type override', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });

  describe('Variants', () => {
    it('should apply primary variant styles by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-white');
    });

    it('should apply secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-200');
    });

    it('should apply danger variant styles', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-500');
    });

    it('should apply ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
    });
  });

  describe('Sizes', () => {
    it('should apply medium size styles by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2');
    });

    it('should apply small size styles', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('should apply large size styles', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should be disabled when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should still render children when loading', () => {
      render(<Button loading>Submit</Button>);
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('should not show spinner when not loading', () => {
      render(<Button>Click</Button>);
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should apply disabled cursor style', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveClass('disabled:cursor-not-allowed');
    });

    it('should not trigger onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Click</Button>);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Click Handler', () => {
    it('should trigger onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click</Button>);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger onClick when loading', () => {
      const handleClick = jest.fn();
      render(<Button loading onClick={handleClick}>Click</Button>);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('should merge custom styles with default styles', () => {
      render(<Button className="my-custom-class">Merged</Button>);
      const button = screen.getByRole('button');
      // Should have both default and custom classes
      expect(button).toHaveClass('rounded-lg');
      expect(button).toHaveClass('my-custom-class');
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through additional HTML attributes', () => {
      render(<Button data-testid="my-button" aria-label="Custom label">Test</Button>);
      const button = screen.getByTestId('my-button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
    });

    it('should support form attribute', () => {
      render(<Button form="my-form">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('form', 'my-form');
    });

    it('should support name attribute', () => {
      render(<Button name="submit-btn">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('name', 'submit-btn');
    });
  });

  describe('Accessibility', () => {
    it('should be focusable', () => {
      render(<Button>Focus Me</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should have focus ring styles', () => {
      render(<Button>Focus</Button>);
      expect(screen.getByRole('button')).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('should support aria-disabled', () => {
      render(<Button disabled aria-disabled="true">Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Inline Styles', () => {
    it('should apply inline style prop', () => {
      render(<Button style={{ marginTop: '10px' }}>Styled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ marginTop: '10px' });
    });

    it('should merge style prop with primary button theme styles', () => {
      render(<Button variant="primary" style={{ marginTop: '10px' }}>Styled Primary</Button>);
      const button = screen.getByRole('button');
      // Should have both custom style and theme background
      expect(button).toHaveStyle({ marginTop: '10px' });
    });
  });
});
