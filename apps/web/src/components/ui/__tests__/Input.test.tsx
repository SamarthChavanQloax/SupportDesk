import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from '../Input';

describe('Input Component', () => {
  it('associates label with input using programmatic id', () => {
    render(<Input label="Ticket Subject" placeholder="Enter title" />);
    const input = screen.getByLabelText('Ticket Subject');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Enter title');
  });

  it('renders required indicator and aria-required attribute', () => {
    render(<Input label="Email Address" required />);
    const input = screen.getByLabelText(/email address/i);
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toBeRequired();
  });

  it('renders validation error message and sets aria-invalid', () => {
    render(<Input label="Title" error="Title must be at least 3 characters" />);
    const input = screen.getByLabelText('Title');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toHaveTextContent('Title must be at least 3 characters');
    expect(input).toHaveAttribute('aria-describedby', errorAlert.id);
  });

  it('renders helper text when no error is present', () => {
    render(
      <Input
        label="Username"
        helperText="Choose a unique handle for your profile"
      />,
    );
    const helper = screen.getByText('Choose a unique handle for your profile');
    expect(helper).toBeInTheDocument();
    const input = screen.getByLabelText('Username');
    expect(input).toHaveAttribute('aria-describedby', helper.id);
  });

  it('renders disabled input state correctly', () => {
    render(<Input label="Readonly Field" disabled />);
    const input = screen.getByLabelText('Readonly Field');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:bg-slate-100');
  });
});
