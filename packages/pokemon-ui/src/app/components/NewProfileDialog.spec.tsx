import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewProfileDialog } from './NewProfileDialog';

describe('NewProfileDialog', () => {
  it('disables the Create button when name is empty', () => {
    render(<NewProfileDialog open onClose={vi.fn()} onCreate={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /create/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('enables the Create button when name is entered', () => {
    render(<NewProfileDialog open onClose={vi.fn()} onCreate={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ash' } });
    const btn = screen.getByRole('button', { name: /create/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('calls onCreate with the entered name on submit', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<NewProfileDialog open onClose={vi.fn()} onCreate={onCreate} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ash' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith('Ash'));
  });

  it('calls onClose after successful creation', async () => {
    const onClose = vi.fn();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<NewProfileDialog open onClose={onClose} onCreate={onCreate} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ash' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
