import express from "express";
import fs from 'fs';

const router = express.Router();

router.get('/', (req, res) => {
    let trigger;
    let readyTrigger = [];
    try {
        const rd = fs.readFileSync(global.triggerPath, "utf-8");

        trigger = JSON.parse(rd);

        trigger.forEach(item => {
            readyTrigger.push({
                id: item.id,
                title: item.title,
                script: encodeURIComponent(item.script)
            })
        });
    } catch (err) {
        readyTrigger = [];
    }

    res.render("trigger", {
        layout: "main",
        title: "Rumput - Triggers",
        header: "Triggers",
        trigger: readyTrigger,
    });
});

router.post("/save", (req, res) => {
    const data = req.body;
    if (!data.trigger || !Array.isArray(data.trigger)) {
        return res.status(400).json({ error: "Format JSON salah" });
    }

    let readyTrigger = [];
    data.trigger.forEach(item => {
        readyTrigger.push({
            id: item.id,
            title: item.title,
            script: decodeURIComponent(item.script)
        })
    });

    fs.writeFileSync(global.triggerPath, JSON.stringify(readyTrigger, null, 2));

    res.json({ message: "Berhasil disimpan" });
});

export default router;