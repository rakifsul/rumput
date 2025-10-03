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
    res.render("enc-note", {
        layout: "main",
        title: "Rumput - Encrypted Notes",
        header: "Encrypted Notes",
    });
});

router.post("/encrypt", (req, res) => {
    const { password, content } = req.body;
    const salt = crypto.randomBytes(16);
    const key = deriveKey(password, salt);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(content, "utf8", "base64");
    encrypted += cipher.final("base64");
    const tag = cipher.getAuthTag().toString("base64");

    const final = {
        iv: iv.toString("base64"),
        salt: salt.toString("base64"),
        tag,
        data: encrypted
    };

    fs.writeFileSync(notePath, JSON.stringify(final, null, 2));

    res.json(final);
});

router.post("/decrypt", (req, res) => {
    try {
        const { password } = req.body;
        const { iv, salt, tag, data } = JSON.parse(fs.readFileSync(notePath));

        const key = deriveKey(password, Buffer.from(salt, "base64"));

        const decipher = crypto.createDecipheriv(
            "aes-256-gcm",
            key,
            Buffer.from(iv, "base64")
        );
        decipher.setAuthTag(Buffer.from(tag, "base64"));

        let decrypted = decipher.update(data, "base64", "utf8");
        decrypted += decipher.final("utf8");

        res.json({ content: decrypted });
    } catch (err) {
        res.json({ error: "Decryption failed" });
    }
});

router.get("/load", (req, res) => {
    try {
        const ret = JSON.parse(fs.readFileSync(notePath));
        res.json(ret);
    } catch (err) {
        res.json({ error: "Loading failed" });
    }
})

function deriveKey(password, salt) {
    return crypto.scryptSync(password, salt, 32); // AES-256 key
}

export default router;