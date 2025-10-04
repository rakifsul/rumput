import express from "express";
import fs from 'fs';

const router = express.Router();

router.get('/', (req, res) => {
    let launcher;
    try {
        launcher = JSON.parse(fs.readFileSync(global.launcherPath, "utf-8"));
    } catch (err) {
        launcher = [];
    }

    let defaultSE;
    try {
        defaultSE = JSON.parse(fs.readFileSync(global.defaultSEPath, "utf-8"));
    } catch (err) {
        defaultSE = {};
    }

    res.render("launcher", {
        layout: "main",
        title: "Rumput - Launchers",
        header: "Launchers",
        launcher: launcher,
        defaultSE: defaultSE.selected
    });
});

router.post("/save", (req, res) => {
    const data = req.body;
    if (!data.launcher || !Array.isArray(data.launcher)) {
        return res.status(400).json({ error: "Format JSON salah" });
    }

    fs.writeFileSync(global.launcherPath, JSON.stringify(data.launcher, null, 2));

    res.json({ message: "Berhasil disimpan" });
});

export default router;