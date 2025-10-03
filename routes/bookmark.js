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
    res.render("bookmark", {
        layout: "main",
        title: "Rumput - Bookmarks",
        header: "Bookmarks",
    });
});

router.get("/search", (req, res) => {
    const q = req.query.q || "";

    const rawIndex = JSON.parse(fs.readFileSync(global.indexPath));
    const rawBookmarks = JSON.parse(fs.readFileSync(global.bookmarkPath));

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

export default router;