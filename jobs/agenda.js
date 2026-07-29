const Agenda = require("agenda");
const mongoose = require("mongoose");

const agenda = new Agenda({
  mongo: mongoose.connection,   // reuse existing Mongo connection
  db: { collection: "agendaJobs" }
});

// graceful shutdown
async function graceful() {
  await agenda.stop();
  process.exit(0);
}
process.on("SIGTERM", graceful);
process.on("SIGINT", graceful);

module.exports = agenda;
