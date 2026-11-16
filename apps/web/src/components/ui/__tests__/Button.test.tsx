import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders children and default primary styles', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-[#2563EB]');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('renders different variants and sizes', () => {
    const { rerender } = render(
      <Button variant="danger" size="lg">
        Delete
      </Button>,
    );
    let button = screen.getByRole('button', { name: /delete/i });
    expect(button).toHaveClass('bg-rose-600');
    expect(button).toHaveClass('px-5');

    rerender(
      <Button variant="outline" size="sm">
        Cancel
      </Button>,
    );
    button = screen.getByRole('button', { name: /cancel/i });
    expect(button).toHaveClass('border-slate-300');
    expect(button).toHaveClass('px-3');
  });

  it('handles loading state with spinner and aria-busy', () => {
    render(<Button isLoading loadingText="Saving...">Save</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent('Saving...');
  });

  it('prevents clicks when disabled or loading', () => {
    const handleClick = vi.fn();
    const { rerender } = render(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>,
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();

    rerender(
      <Button isLoading onClick={handleClick}>
        Loading Button
      </Button>,
    );
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders left and right icons', () => {
    render(
      <Button
        leftIcon={<span data-testid="left-icon">+</span>}
        rightIcon={<span data-testid="right-icon">&rarr;</span>}
      >
        Next
      </Button>,
    );
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });
});
