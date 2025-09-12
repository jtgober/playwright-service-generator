/**
 * Convert a string to camelCase.
 */
export const toCamelCase = (name: string): string => {
  return name.charAt(0).toLowerCase() + name.slice(1);
};

/**
 * Generate a method name from HTTP method + route + optional operationId.
 * Removes "ApiV1" from the final method name.
 */
export const toCamelCaseMethodName = (
  method: string,
  route?: string,
  operationId?: string
): string => {
  // Use operationId directly if provided
  if (operationId) return operationId;

  // Fallback if route is undefined
  if (!route) return method.toLowerCase();

  // Remove query parameters
  const cleanRoute = route.split('?')[0] ?? '';

  // Split route into segments
  const parts = cleanRoute.split('/').filter(Boolean);

  // Convert each segment into PascalCase or ByX for path params
  const nameParts = parts.map(part => {
    if (part.startsWith('{') && part.endsWith('}')) {
      const paramName = part.slice(1, -1);
      return `By${paramName.charAt(0).toUpperCase()}${paramName.slice(1)}`;
    }

    // Remove non-alphanumeric characters and capitalize first letter
    const cleaned = part.replace(/[^a-zA-Z0-9]/g, '');
    return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : '';
  });

  // Combine method + name parts
  let rawName = method.toLowerCase() + nameParts.join('');

  // Remove "ApiV1" from the method name
  rawName = rawName.replace(/ApiV1/i, '');

  // Return camelCase
  return rawName.charAt(0).toLowerCase() + rawName.slice(1);
};
