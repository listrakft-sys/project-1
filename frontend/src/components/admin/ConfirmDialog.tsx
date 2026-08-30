'use client';

import React from 'react';
import Modal from './Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Info, AlertOctagon } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const iconMap = {
    danger: <AlertOctagon className="h-6 w-6 text-destructive" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-500" />,
    info: <Info className="h-6 w-6 text-sky-500" />,
  };

  const bgMap = {
    danger: 'bg-destructive/10',
    warning: 'bg-amber-500/10',
    info: 'bg-sky-500/10',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4 pt-2">
        <div className={`p-3 rounded-full shrink-0 ${bgMap[variant]}`}>{iconMap[variant]}</div>
        <p className="text-sm text-muted-foreground leading-relaxed pt-1">{description}</p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
