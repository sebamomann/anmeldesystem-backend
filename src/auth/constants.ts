export const jwtConstants = {
    secret: process.env.JWT_SECRET != null ? process.env.JWT_SECRET : "default",
};
