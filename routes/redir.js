import express from "express";
import fs from 'fs';

const router = express.Router();

router.get('/', (req, res) => {
    // res.redirect("/launchers");

    let defaultAF;
    try {
        console.log(global.defaultAFPath)
        defaultAF = JSON.parse(fs.readFileSync(global.defaultAFPath, "utf-8"));
    } catch (err) {
        console.log("err")
        defaultAF = {
            selected: "autofocus-force-no"
        };
    }

    res.render("redir", {
        layout: "main",
        title: "Rumput",
        header: "Rumput",
        defaultAF: defaultAF.selected
    });
});

export default router;