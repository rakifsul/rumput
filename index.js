import express from 'express';
import { engine } from 'express-handlebars';
import lunr from "lunr";
import path from 'path';
import multer from 'multer';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { Worker } from "worker_threads";

const __dirname = import.meta.dirname;
const uploadDir = path.join(__dirname, "uploads");
const resultDir = path.join(__dirname, "data");
const launcherPath = path.join(resultDir, "launcher.json");
const bookmarkPath = path.join(resultDir, "bookmark.json");
const indexPath = path.join(resultDir, "index.json");

let progress = 0;

const app = express();
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, "bookmark-processing.html"); // nama file statis
    }
});
const upload = multer({ storage });

app.use(express.json({ limit: "2000mb" }));
app.use(express.urlencoded({ limit: "2000mb", extended: true }));

app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.set('views', './views');
app.use("/public", express.static(path.join(__dirname, "public")));

// Simpan state progress per file
let progressMap;
let processingFilePath;
//

app.get('/', (req, res) => {
    let launcher;
    try {
        launcher = JSON.parse(fs.readFileSync(launcherPath, "utf-8"));
    } catch (err) {
        launcher = [];
    }

    res.render("launcher", {
        layout: "main",
        title: "Rumput - Launchers",
        header: "Launchers",
        launcher: launcher
    });
});

app.get('/bookmark', (req, res) => {
    res.render("bookmark", {
        layout: "main",
        title: "Rumput - Bookmarks",
        header: "Bookmarks",
    });
});

app.get('/settings', (req, res) => {
    res.render("settings", {
        layout: "main",
        title: "Rumput - Settings",
        header: "Settings",
    });
});

app.post("/upload-bookmark", upload.single("file"), (req, res) => {
    processingFilePath = path.join(uploadDir, "bookmark-processing.html");
    progressMap = { current: 0, total: 0, percent: 0, done: false };
    res.json({ message: "Upload success", processingFilePath });
});

app.post("/parse-bookmark", (req, res) => {
    if (!fs.existsSync(processingFilePath)) {
        return res.status(404).send("File not found");
    }

    const worker = new Worker(path.join(__dirname, "workers/parseWorker.js"), {
        workerData: { filePath: processingFilePath, resultDir: resultDir },
    });

    worker.on("message", (msg) => {
        if (msg.phase === "log") {
            console.log(`[WORKER LOG] ${msg.time} - ${msg.message}`);
        } else {
            // update progress
            progressMap = msg;
        }
    });

    worker.on("error", (err) => console.error("Worker error:", err));
    worker.on("exit", (code) => console.log("Worker exited:", code));

    res.json({ message: "Parsing started" });
});

app.get("/progress-check", (req, res) => {
    let ret = {
        percent: 8
    }

    if (!progressMap) {
        ret = {
            percent: 4
        }

        res.json(ret);
        return;
    }

    if (!progressMap.percent) {
        ret = {
            percent: 3
        }
        res.json(ret);
        return;
    }

    ret = {
        percent: progressMap.percent
    }

    res.json(ret);
});

app.post("/save-launcher", (req, res) => {
    const data = req.body;
    if (!data.launcher || !Array.isArray(data.launcher)) {
        return res.status(400).json({ error: "Format JSON salah" });
    }

    fs.writeFileSync(launcherPath, JSON.stringify(data.launcher, null, 2));

    res.json({ message: "Berhasil disimpan" });
});

app.get("/search", (req, res) => {
    const q = req.query.q || "";

    const rawIndex = JSON.parse(fs.readFileSync(indexPath));
    const rawBookmarks = JSON.parse(fs.readFileSync(bookmarkPath));

    const index = lunr.Index.load(rawIndex);
    const results = index.search(q);
    const limitedResults = results.slice(0, 20);
    // hasil lunr hanya id, ambil data aslinya
    const finalResults = limitedResults.map(r => {
        const doc = rawBookmarks.find(b => b.url == r.ref);
        return { score: r.score, ...doc };
    });

    res.json(finalResults);
});

app.delete("/clear-launcher", (req, res) => {
    fs.truncate(launcherPath, 0, (err) => {
        if (err) throw err;
        console.log("File dikosongkan (async).");
    });
    res.json({ message: "Berhasil didelete" });
});

app.delete("/clear-bookmark", (req, res) => {
    fs.truncate(bookmarkPath, 0, (err) => {
        if (err) throw err;
        console.log("File dikosongkan (async).");
    });
    res.json({ message: "Berhasil didelete" });
});

app.delete("/clear-index", (req, res) => {
    fs.truncate(indexPath, 0, (err) => {
        if (err) throw err;
        console.log("File dikosongkan (async).");
    });
    res.json({ message: "Berhasil didelete" });
});

app.listen(3000);