// ===================== Utilidades de Fechas Seguras (UTC) ======================
// Funciones para manejo de fechas sin problemas de zona horaria ni DST
// Todas las fechas se manejan como strings YYYY-MM-DD y cálculos en UTC

/**
 * Convierte un objeto Date a formato YYYY-MM-DD usando sus campos UTC
 * @param {Date} dt - Objeto Date
 * @returns {string} - Fecha en formato YYYY-MM-DD
 */
export const formatUTCToYMD = (dt) => {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Convierte YYYY-MM-DD a DD/MM/YYYY sin crear objetos Date locales
 * @param {string} ymd - Fecha en formato YYYY-MM-DD
 * @returns {string} - Fecha en formato DD/MM/YYYY
 */
export const formatYMDToDMY = (ymd) => {
  if (!ymd) return "-";
  const [y, m, d] = ymd.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
};

/**
 * Suma días a una fecha YYYY-MM-DD anclando a 12:00 UTC para evitar problemas de DST
 * @param {string} fechaYmd - Fecha base en formato YYYY-MM-DD
 * @param {number} dias - Número de días a sumar (puede ser negativo)
 * @returns {string} - Nueva fecha en formato YYYY-MM-DD
 */
export const sumarDiasYMD = (fechaYmd, dias) => {
  const [y, m, d] = fechaYmd.split("-").map(Number);
  // Ancla a 12:00 UTC para evitar bordes de medianoche/DST
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + dias);
  return formatUTCToYMD(dt);
};

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD en UTC
 * @returns {string} - Fecha actual en formato YYYY-MM-DD
 */
export const todayYMDUTC = () => {
  const now = new Date();
  return formatUTCToYMD(new Date(Date.UTC(
    now.getUTCFullYear(), 
    now.getUTCMonth(), 
    now.getUTCDate()
  )));
};

/**
 * Crea un objeto Date anclado a mediodía UTC para comparaciones seguras
 * Útil cuando necesites comparar fechas YYYY-MM-DD
 * @param {string} ymd - Fecha en formato YYYY-MM-DD
 * @returns {Date} - Objeto Date anclado a 12:00 UTC
 */
export const toSafeUTCDate = (ymd) => new Date(ymd + "T12:00:00Z");

/**
 * Formatea un rango de fechas como "DD/MM - DD/MM/YYYY"
 * @param {string} inicio - Fecha de inicio YYYY-MM-DD
 * @param {string} fin - Fecha de fin YYYY-MM-DD
 * @returns {string} - Rango formateado
 */
export const formatPeriodo = (inicio, fin) => {
  if (!inicio || !fin) return "-";
  const [iy, im, id] = inicio.split("-").map(Number);
  const [fy, fm, fd] = fin.split("-").map(Number);
  const iDM = `${String(id).padStart(2, "0")}/${String(im).padStart(2, "0")}`;
  const fDMY = `${String(fd).padStart(2, "0")}/${String(fm).padStart(2, "0")}/${fy}`;
  return `${iDM} - ${fDMY}`;
};

/**
 * Calcula la diferencia en días entre dos fechas YYYY-MM-DD
 * @param {string} fechaInicio - Fecha inicial YYYY-MM-DD
 * @param {string} fechaFin - Fecha final YYYY-MM-DD
 * @returns {number} - Diferencia en días (positivo si fechaFin > fechaInicio)
 */
export const diferenciaDiasYMD = (fechaInicio, fechaFin) => {
  const inicio = toSafeUTCDate(fechaInicio);
  const fin = toSafeUTCDate(fechaFin);
  const diffTime = fin - inicio;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Verifica si una fecha YYYY-MM-DD es anterior, igual o posterior a hoy
 * @param {string} fechaYmd - Fecha a comparar YYYY-MM-DD
 * @returns {string} - 'pasado', 'presente' o 'futuro'
 */
export const compararConHoy = (fechaYmd) => {
  const hoy = todayYMDUTC();
  if (fechaYmd < hoy) return 'pasado';
  if (fechaYmd > hoy) return 'futuro';
  return 'presente';
};