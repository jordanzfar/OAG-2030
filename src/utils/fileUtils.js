/**
 * Sanea un nombre de archivo para hacerlo seguro para URLs y almacenamiento en la nube.
 * @param {string} filename - El nombre original del archivo.
 * @returns {string} El nombre de archivo saneado.
 */
export const sanitizeFileName = (filename) => {
  // Extraer la extensión del archivo para conservarla
  const extension = filename.slice(filename.lastIndexOf('.'));
  const nameWithoutExtension = filename.slice(0, filename.lastIndexOf('.'));

  const sanitized = nameWithoutExtension
    .toLowerCase()              // 1. Convertir a minúsculas
    .replace(/\s+/g, '-')       // 2. Reemplazar espacios con guiones
    .replace(/ñ/g, 'n')         // 3. Reemplazar 'ñ' por 'n'
    .replace(/[^\w-]/g, '');    // 4. Eliminar cualquier caracter que no sea letra, número o guion

  // Añadir un timestamp para asegurar que el nombre sea único y evitar sobreescrituras
  const uniqueSuffix = Date.now();

  return `${sanitized}-${uniqueSuffix}${extension}`;
};