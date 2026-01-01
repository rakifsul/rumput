import express from "express";
import bcrypt from "bcryptjs";
import fs from 'fs';

const router = express.Router();


router.get('/', (req, res) => {
    res.render("note", {
        layout: "main",
        title: "Rumput - Notes",
        header: "Notes",
    });
});

router.post("/store", (req, res) => {
    const { pass, content } = req.body;

    const final = {
        password: bcrypt.hashSync(pass, 12),
        data: content
    };

    fs.writeFileSync(global.notePath, JSON.stringify(final, null, 2));

    res.json(final);
});

router.post("/retrieve", (req, res) => {
    try {
        const { pass } = req.body;
        const { password, data } = JSON.parse(fs.readFileSync(global.notePath));

        if (!bcrypt.compareSync(pass, password) == true) {
            throw new Error("Incorrect password.");
        }

        res.json({ content: data });
    } catch (err) {
        res.json({ error: err });
    }
});

export default router;