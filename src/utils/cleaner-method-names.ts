export const toCamelCaseMethodName = (
  method: string,
  route?: string,
  operationId?: string
): string => {
  if (operationId) return operationId;

  if (!route) return method.toLowerCase(); // fallback if route is undefined

  const safeRoute: string = route; // TypeScript now knows it's a string

  // Remove query params
  const cleanRoute = safeRoute?.split('?')[0] ?? '';

  // Split by slashes, filter out empty parts
  const parts = cleanRoute.split('/').filter(Boolean);

  // Convert each part to PascalCase (except method)
  const nameParts = parts.map(p => {
    if (p.startsWith('{') && p.endsWith('}')) {
      const paramName = p.slice(1, -1);
      return `By${paramName.charAt(0).toUpperCase()}${paramName.slice(1)}`;
    }
    const cleaned = p.replace(/[^a-zA-Z0-9]/g, '');
    return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : '';
  });

  // Combine method + parts, then convert first char to lowercase (camelCase)
  const rawName = method.toLowerCase() + nameParts.join('');
  return rawName.charAt(0).toLowerCase() + rawName.slice(1);
}
