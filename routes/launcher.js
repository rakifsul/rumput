import express from "express";

import crypto from 'crypto';
import lunr from "lunr";
import path from 'path';
import multer from 'multer';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { Worker } from "worker_threads";

const router = express.Router();

router.get('/', (req, res) => {
    let launcher;
    try {
        launcher = JSON.parse(fs.readFileSync(global.launcherPath, "utf-8"));
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

router.post("/save", (req, res) => {
    const data = req.body;
    if (!data.launcher || !Array.isArray(data.launcher)) {
        return res.status(400).json({ error: "Format JSON salah" });
    }

    fs.writeFileSync(global.launcherPath, JSON.stringify(data.launcher, null, 2));

    res.json({ message: "Berhasil disimpan" });
});

export default router;