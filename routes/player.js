import express from "express";
import fs from 'fs';

const router = express.Router();

router.get('/', (req, res) => {
    let vdEmbed;
    let readyvdEmbed = [];
    try {
        const rd = fs.readFileSync(global.vdEmbedPath, "utf-8");

        vdEmbed = JSON.parse(rd);

        vdEmbed.forEach(item => {
            readyvdEmbed.push({
                id: item.id,
                title: item.title,
                url: item.url
            })
        });
    } catch (err) {
        readyvdEmbed = [];
    }

    res.render("player", {
        layout: "main",
        title: "Rumput - Players",
        header: "Players",
        vdEmbed: readyvdEmbed,
    });
});

router.post("/save", (req, res) => {
    const data = req.body;
    if (!data.vdEmbed || !Array.isArray(data.vdEmbed)) {
        return res.status(400).json({ error: "Format JSON salah" });
    }

    let readyvdEmbed = [];
    data.vdEmbed.forEach(item => {
        readyvdEmbed.push({
            id: item.id,
            title: item.title,
            url: item.url
        })
    });

    fs.writeFileSync(global.vdEmbedPath, JSON.stringify(readyvdEmbed, null, 2));

    res.json({ message: "Berhasil disimpan" });
});

export default router;