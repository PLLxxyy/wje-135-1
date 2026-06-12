export const jwtConfig = {
  secret: process.env.JWT_SECRET || "warehouse-stock-local-secret",
  expiresIn: process.env.JWT_EXPIRES_IN || "8h"
};
