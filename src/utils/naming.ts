export const toCamelCase = (name: string): string => {
    return name.charAt(0).toLowerCase() + name.slice(1);
}

export const toCamelCaseMethodName = (
    method: string,
    route?: string,
    operationId?: string
): string => {
    if (operationId) return operationId;
    if (!route) return method.toLowerCase();

    const cleanRoute = route.split('?')[0] ?? '';
    const parts = cleanRoute.split('/').filter(Boolean);

    const nameParts = parts.map(p =>
        p.startsWith('{') && p.endsWith('}')
            ? `By${p[1] ? p[1].toUpperCase() : ''}${p.slice(2, -1)}`
            : p.replace(/[^a-zA-Z0-9]/g, '').replace(/^\w/, c => c.toUpperCase())
    );

    const rawName = method.toLowerCase() + nameParts.join('');
    return rawName.charAt(0).toLowerCase() + rawName.slice(1);
}
