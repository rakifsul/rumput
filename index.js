import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';

import bookmarkRouter from './routes/bookmark.js';
import encNoteRouter from './routes/enc-note.js';
import launcherRouter from './routes/launcher.js';
import settingRouter from './routes/setting.js';

const __dirname = import.meta.dirname;
global.dirname = __dirname;
global.uploadDir = path.join(__dirname, "uploads");
global.resultDir = path.join(__dirname, "data");
global.launcherPath = path.join(global.resultDir, "launcher.json");
global.bookmarkPath = path.join(global.resultDir, "bookmark.json");
global.indexPath = path.join(global.resultDir, "index.json");
global.notePath = path.join(global.resultDir, "note.json");
global.defaultSEPath = path.join(global.resultDir, "default-se.json");

const app = express();

app.use(express.json({ limit: "2000mb" }));
app.use(express.urlencoded({ limit: "2000mb", extended: true }));

app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.set('views', './views');
app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/settings", settingRouter);
app.use("/enc-notes", encNoteRouter);
app.use("/bookmarks", bookmarkRouter);
app.use("/launchers", launcherRouter);

app.get("/", (req, res) => {
    res.redirect("/launchers");
})

const port = 3000;
app.listen(port, function () {
    console.log(`server berjalan di port ${port}`);
});