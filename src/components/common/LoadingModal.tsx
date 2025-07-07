import React, { useEffect, useState, useRef } from 'react';

interface LoadingModalProps {
  show: boolean;
  isLoading: boolean;
  loadingText?: string;
  successText?: string;
  loadingSubtext?: string;
  successSubtext?: string;
  onClose?: () => void;
  autoCloseDelay?: number;
}

const LoadingModal: React.FC<LoadingModalProps> = ({
  show,
  isLoading,
  loadingText = 'Cargando...',
  successText = '¡Éxito!',
  loadingSubtext = 'Por favor, espere un momento',
  successSubtext = 'La operación se completó correctamente',
  onClose,
  autoCloseDelay = 3000
}) => {
  const [countdown, setCountdown] = useState(Math.ceil(autoCloseDelay / 1000));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Efecto que se ejecuta cuando el modal cambia a modo success (no loading)
  useEffect(() => {
    // Limpiar intervalos previos
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!show || isLoading || autoCloseDelay <= 0 || !onClose) {
      return;
    }

    console.log('Iniciando auto-cierre'); // Debug

    // Reiniciar countdown
    const initialCountdown = Math.ceil(autoCloseDelay / 1000);
    setCountdown(initialCountdown);
    
    // Intervalo para actualizar countdown cada segundo
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        const newValue = prev - 1;
        console.log('Countdown:', newValue); // Debug
        return Math.max(0, newValue);
      });
    }, 1000);

    // Timer para cerrar el modal
    timeoutRef.current = setTimeout(() => {
      console.log('Auto-cerrando modal'); // Debug
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      onClose();
    }, autoCloseDelay);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [show, isLoading]); // Solo depende de show e isLoading

  if (!show) return null;

  return (
    <div 
      className="modal fade show d-block" 
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1050 
      }}
      tabIndex={-1}
      role="dialog"
      aria-hidden="true"
      onClick={!isLoading && onClose ? onClose : undefined}
    >
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-body text-center p-5">
            {isLoading ? (
              <div className="d-flex flex-column align-items-center">
                <div className="mb-4">
                  <div 
                    className="spinner-border text-primary"
                    style={{ 
                      width: '3rem', 
                      height: '3rem', 
                      borderWidth: '4px',
                      animation: 'spin 1s linear infinite'
                    }}
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
                <h5 className="mb-2 fw-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {loadingText}
                </h5>
                <p className="text-muted mb-0 small">{loadingSubtext}</p>
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center">
                <div 
                  className="d-flex align-items-center justify-content-center rounded-circle mb-4"
                  style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#28a745',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}
                >
                  <svg 
                    width="40" 
                    height="40" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                </div>
                <h4 className="mb-2 fw-bold" style={{ color: '#28a745' }}>
                  {successText}
                </h4>
                <p className="text-muted mb-0 small">
                  {successSubtext}
                </p>
                {autoCloseDelay > 0 && onClose && (
                  <div className="mt-3">
                    <small className="text-muted">
                      {countdown > 0 ? (
                        <>Se cerrará automáticamente en <strong>{countdown}</strong> segundo{countdown !== 1 ? 's' : ''}</>
                      ) : (
                        <strong>Cerrando...</strong>
                      )}
                    </small>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingModal; 