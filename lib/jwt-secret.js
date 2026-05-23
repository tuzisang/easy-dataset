const SECRET_KEY = process.env.JWT_SECRET || 'dev-secret-change-in-production';
export const JWT_SECRET = new TextEncoder().encode(SECRET_KEY);
