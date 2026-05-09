// Add the import near other route imports.
const noteRoutes = require("./routes/notes");

// Register the routes with the backend app.
await app.register(noteRoutes);
