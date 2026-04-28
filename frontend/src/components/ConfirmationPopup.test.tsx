import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfirmationPopup from './ConfirmationPopup';

describe('ConfirmationPopup', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Test Title',
    message: 'Test message',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(<ConfirmationPopup {...defaultProps} />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ConfirmationPopup {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmationPopup {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Yes'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<ConfirmationPopup {...defaultProps} />);
    
    fireEvent.click(screen.getByText('No'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when close button is clicked', () => {
    render(<ConfirmationPopup {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: '' })); // Close button
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when backdrop is clicked', () => {
    render(<ConfirmationPopup {...defaultProps} />);
    
    const backdrop = document.querySelector('.bg-black.bg-opacity-50');
    fireEvent.click(backdrop!);
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders custom button text', () => {
    render(
      <ConfirmationPopup 
        {...defaultProps} 
        confirmText="Delete" 
        cancelText="Keep" 
      />
    );
    
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('applies danger variant styling', () => {
    render(<ConfirmationPopup {...defaultProps} variant="danger" />);
    
    const confirmButton = screen.getByText('Yes');
    expect(confirmButton).toHaveClass('bg-red-600');
  });

  it('applies warning variant styling', () => {
    render(<ConfirmationPopup {...defaultProps} variant="warning" />);
    
    const confirmButton = screen.getByText('Yes');
    expect(confirmButton).toHaveClass('bg-yellow-600');
  });

  it('applies info variant styling by default', () => {
    render(<ConfirmationPopup {...defaultProps} />);
    
    const confirmButton = screen.getByText('Yes');
    expect(confirmButton).toHaveClass('bg-teal-600');
  });
});