import React from "react";
import Typewriter from "typewriter-effect";

const AnimatedChat: React.FC = () => {
  return (
    <div 
      className="card shadow-lg mx-auto"
      style={{ 
        maxWidth: '400px',
        borderColor: 'var(--color-stroke)',
        backgroundColor: 'var(--color-background-primary)'
      }}
    >
      <div className="card-body p-4">
        <div className="d-flex flex-column gap-3">
          {/* Mensaje 1 (Otro usuario) */}
          <div className="d-flex align-items-start">
            <div 
              className="px-3 py-2 rounded"
              style={{ 
                backgroundColor: 'var(--color-background-secondary)',
                maxWidth: '75%'
              }}
            >
              <p className="mb-0 small" style={{ color: 'var(--color-text-primary)' }}>
                Hola! ¿Cómo va el proyecto de la nueva plataforma?
              </p>
            </div>
          </div>

          {/* Mensaje 2 (Usuario principal) */}
          <div className="d-flex align-items-start justify-content-end">
            <div 
              className="px-3 py-2 rounded text-white"
              style={{ 
                backgroundColor: 'var(--color-primary)',
                maxWidth: '75%'
              }}
            >
              <p className="mb-0 small">
                ¡Hola! Va muy bien, estamos avanzando rápido.
              </p>
            </div>
          </div>

          {/* Mensaje 3 con Typewriter */}
          <div className="d-flex align-items-start">
            <div 
              className="px-3 py-2 rounded"
              style={{ 
                backgroundColor: 'var(--color-background-secondary)',
                maxWidth: '75%'
              }}
            >
              <div className="small" style={{ color: 'var(--color-text-primary)' }}>
                <Typewriter
                  options={{
                    strings: [
                      "Genial, ¿necesitas ayuda con algo?",
                      "La IA puede analizar las métricas de uso.",
                      "Y también optimizar la comunicación.",
                    ],
                    autoStart: true,
                    loop: true,
                    delay: 50,
                    deleteSpeed: 20,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedChat;
