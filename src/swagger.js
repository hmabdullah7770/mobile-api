// swagger.js
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const userOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User API",
      version: "1.0.0",
      description: "User management endpoints"
    },
    servers: [{ url: "http://localhost:4000" }],
    components: {
      securitySchemes: {
        bearerAuth: { 
          type: "http", 
          scheme: "bearer", 
          bearerFormat: "JWT" 
        }
      }
    }
  },
  apis: [
    "./swagger-ApiTesting/user-swagger-definitions.js",
    "./routes/userRoutes.js",
    "./controllers/userController.js"
  ]
};

const userSpec = swaggerJSDoc(userOptions);

const setupSwagger = (app) => {
  app.use("/user-docs", 
    swaggerUi.serve, 
    swaggerUi.setup(userSpec, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        defaultModelsExpandDepth: 0
      }
    })
  );
};

export default setupSwagger;