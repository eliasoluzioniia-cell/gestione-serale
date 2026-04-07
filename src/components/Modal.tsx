import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-all"
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto border border-surface-variant flex flex-col"
            >
              {/* Header */}
              <div className="px-8 pt-8 pb-4 flex justify-between items-center bg-gradient-to-b from-white to-surface-variant/10">
                <h2 className="text-2xl font-black font-headline tracking-tight text-on-surface">{title}</h2>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-surface-variant/50 transition-colors text-slate-400 hover:text-on-surface"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Body */}
              <div className="p-8 pt-4 overflow-y-auto max-h-[70vh]">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
