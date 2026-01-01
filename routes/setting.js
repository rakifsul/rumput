import express from "express";
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { Worker } from "worker_threads";

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, global.uploadDir);
    },
    filename: (req, file, cb) => {
        // nama file tetap
        cb(null, "bookmark-processing.html");
    }
});
const upload = multer({ storage });

// Simpan state progress per file
let progressMap;
let processingFilePath;
//

router.get('/', (req, res) => {
    let defaultSE;
    try {
        const rd = fs.readFileSync(global.defaultSEPath, "utf-8");

        defaultSE = JSON.parse(rd);
    } catch (err) {
        defaultSE = {
            selected: "search-google"
        };
    }

    let defaultAF;
    try {
        defaultAF = JSON.parse(fs.readFileSync(global.defaultAFPath, "utf-8"));
        console.log(global.defaultAFPath)
    } catch (err) {
        defaultAF = {
            selected: "autofocus-force-no"
        };
    }

    res.render("setting", {
        layout: "main",
        title: "Rumput - Settings",
        header: "Settings",
        defaultSE: defaultSE.selected,
        defaultAF: defaultAF.selected,
    });
});

router.post("/default-se/save", (req, res) => {
    const data = req.body;
    if (!data.selected) {
        return res.status(400).json({ error: "Format JSON salah" });
    }

    fs.writeFileSync(global.defaultSEPath, JSON.stringify(data, null, 2));

    res.json({ message: "Berhasil disimpan" });
});

router.post("/default-af/save", (req, res) => {
    const data = req.body;
    if (!data.selected) {
        return res.status(400).json({ error: "Format JSON salah" });
    }

    fs.writeFileSync(global.defaultAFPath, JSON.stringify(data, null, 2));

    res.json({ message: "Berhasil disimpan" });
});

router.delete("/clear-launcher", (req, res) => {
    fs.truncate(global.launcherPath, 0, (err) => {
        if (err) throw err;
        console.log("File dikosongkan (async).");
    });
    res.json({ message: "Berhasil didelete" });
});

router.delete("/clear-bookmark", (req, res) => {
    fs.truncate(global.bookmarkPath, 0, (err) => {
        if (err) throw err;
        console.log("File dikosongkan (async).");
    });
    res.json({ message: "Berhasil didelete" });
});

router.delete("/clear-index", (req, res) => {
    fs.truncate(global.indexPath, 0, (err) => {
        if (err) throw err;
        console.log("File dikosongkan (async).");
    });
    res.json({ message: "Berhasil didelete" });
});

router.delete("/clear-note", (req, res) => {
    fs.truncate(global.notePath, 0, (err) => {
        if (err) throw err;
        console.log("File dikosongkan (async).");
    });
    res.json({ message: "Berhasil didelete" });
});

router.post("/upload-bookmark", upload.single("file"), (req, res) => {
    processingFilePath = path.join(global.uploadDir, "bookmark-processing.html");
    progressMap = { current: 0, total: 0, percent: 0, done: false };
    res.json({ message: "Upload success", processingFilePath });
});

router.post("/parse-bookmark", (req, res) => {
    if (!fs.existsSync(processingFilePath)) {
        return res.status(404).send("File not found");
    }

    const worker = new Worker(path.join(global.dirname, "workers/parseWorker.js"), {
        workerData: { filePath: processingFilePath, resultDir: global.resultDir },
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

router.get("/progress-check", (req, res) => {
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
export default router;