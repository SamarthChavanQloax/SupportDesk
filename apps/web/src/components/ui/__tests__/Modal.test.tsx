import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from '../Modal';

describe('Modal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Dialog">
        Modal Content
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders semantic dialog with accessible title and description when isOpen is true', () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Confirm Status Change"
        description="Are you sure you want to resolve this ticket?"
      >
        <p>Action details</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Confirm Status Change' });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(
      screen.getByText('Are you sure you want to resolve this ticket?'),
    ).toBeInTheDocument();
    expect(screen.getByText('Action details')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Close Ticket">
        Body text
      </Modal>,
    );

    const closeButton = screen.getByRole('button', { name: /close dialog/i });
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Escape Test">
        Modal Body
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders footer actions', () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Footer Dialog"
        footer={<button type="button">Confirm</button>}
      >
        Body
      </Modal>,
    );

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });
});
