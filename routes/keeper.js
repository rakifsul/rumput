import express from "express";
import fs from 'fs';

const router = express.Router();

router.get('/', (req, res) => {
    let note;
    let readyNote = [];
    try {
        const rd = fs.readFileSync(global.notePath, "utf-8");

        note = JSON.parse(rd);

        note.forEach(item => {
            readyNote.push({
                id: item.id,
                title: item.title,
                note: encodeURIComponent(item.note)
            })
        });
    } catch (err) {
        readyNote = [];
    }

    res.render("keeper", {
        layout: "main",
        title: "Rumput - Keepers",
        header: "Keepers",
        note: readyNote.sort((a, b) => a.title.localeCompare(b.title)),
    });
});

router.post("/save", (req, res) => {
    const data = req.body;
    if (!data.note || !Array.isArray(data.note)) {
        return res.status(400).json({ error: "Format JSON salah" });
    }

    let readyNote = [];
    data.note.forEach(item => {
        readyNote.push({
            id: item.id,
            title: item.title,
            note: decodeURIComponent(item.note)
        })
    });

    fs.writeFileSync(global.notePath, JSON.stringify(readyNote, null, 2));

    res.json({ message: "Berhasil disimpan" });
});

export default router;