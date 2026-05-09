const { listNoteDates, readNotesByDate } = require("../services/note-service");

async function noteRoutes(app) {
  app.get("/api/notes/dates", async () => {
    return {
      dates: listNoteDates(app.config),
    };
  });

  app.get("/api/notes/day", async (req, reply) => {
    const date = typeof req.query?.date === "string" ? req.query.date.trim() : "";
    if (!date) {
      reply.code(400);
      return { message: "缺少日期" };
    }
    try {
      return {
        date,
        notes: readNotesByDate(app.config, date),
      };
    } catch {
      reply.code(404);
      return {
        date,
        notes: [],
        message: "当天没有小纸条",
      };
    }
  });
}

module.exports = noteRoutes;
