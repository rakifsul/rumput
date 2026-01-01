import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';

import bookmarkRouter from './routes/bookmark.js';
import noteRouter from './routes/note.js';
import launcherRouter from './routes/launcher.js';
import triggerRouter from './routes/triggers.js';
import settingRouter from './routes/setting.js';
import redirRouter from './routes/redir.js';

const __dirname = import.meta.dirname;
global.dirname = __dirname;
global.uploadDir = path.join(__dirname, "uploads");
global.resultDir = path.join(__dirname, "data");
global.launcherPath = path.join(global.resultDir, "launcher.json");
global.triggerPath = path.join(global.resultDir, "trigger.json");
global.bookmarkPath = path.join(global.resultDir, "bookmark.json");
global.indexPath = path.join(global.resultDir, "index.json");
global.notePath = path.join(global.resultDir, "note.json");
global.defaultSEPath = path.join(global.resultDir, "default-se.json");
global.defaultAFPath = path.join(global.resultDir, "default-af.json");

const app = express();

app.use(express.json({ limit: "2000mb" }));
app.use(express.urlencoded({ limit: "2000mb", extended: true }));

app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.set('views', './views');
app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/settings", settingRouter);
app.use("/notes", noteRouter);
app.use("/bookmarks", bookmarkRouter);
app.use("/launchers", launcherRouter);
app.use("/triggers", triggerRouter);
app.get("/", redirRouter);

const port = process.env.RUMPUT_PORT || 3000;
const host = process.env.RUMPUT_HOST || "127.0.0.1";
app.listen(port, host, function () {
    console.log(`server berjalan di http://${host}:${port}`);
});