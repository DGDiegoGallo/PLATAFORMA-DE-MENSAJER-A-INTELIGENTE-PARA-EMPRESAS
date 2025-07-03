// Centraliza la URL base del backend para que pueda cambiarse fácilmente
// Utiliza variables de entorno con prefijo VITE_ para que Vite las exponga en el cliente.
// Si VITE_STRAPI_API_URL no está definida, se usará la URL por defecto en localhost.

const API_URL: string = import.meta.env.VITE_STRAPI_API_URL || 'http://localhost:1337';

export default API_URL;
