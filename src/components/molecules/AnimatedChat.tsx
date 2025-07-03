import React from "react";
import Typewriter from "typewriter-effect";

const AnimatedChat: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-md mx-auto border border-stroke">
      <div className="flex flex-col space-y-4">
        {/* Mensaje 1 (Otro usuario) */}
        <div className="flex items-start">
          <div className="bg-background-secundario p-3 rounded-lg max-w-xs">
            <p className="text-sm text-primario-texto">
              Hola! ¿Cómo va el proyecto de la nueva plataforma?
            </p>
          </div>
        </div>

        {/* Mensaje 2 (Usuario principal) */}
        <div className="flex items-start justify-end">
          <div className="bg-principal text-white p-3 rounded-lg max-w-xs">
            <p className="text-sm text-black">
              ¡Hola! Va muy bien, estamos avanzando rápido.
            </p>
          </div>
        </div>

        {/* Mensaje 3 con Typewriter */}
        <div className="flex items-start">
          <div className="bg-background-secundario p-3 rounded-lg max-w-xs">
            <div className="text-sm text-primario-texto">
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
  );
};

export default AnimatedChat;
