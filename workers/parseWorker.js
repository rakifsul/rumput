import { parentPort, workerData } from "worker_threads";
import fs from "fs";
import * as cheerio from "cheerio";
import lunr from "lunr";
import path from "path";

const { filePath, resultDir } = workerData;

async function parse() {
    log("parsing started")

    const html = fs.readFileSync(filePath, "utf8");
    const $ = cheerio.load(html);

    let i = 0;
    let total = $("a").length;
    const results = [];

    // ambil semua <a>
    $("a").each(async (_, el) => {
        const href = $(el).attr("href");
        const text = $(el).text().trim().replace(/<[^>]*>?/gm, '').slice(0, 200);
        const add_date = $(el).attr("add_date");

        if (href) {
            const obj = {
                title: text,
                url: href,
                add_date: add_date
            };

            results.push(obj);

            // update progress setiap 500 link
            if (i % 500 === 0 || i === total - 1) {
                parentPort.postMessage({
                    current: i + 1,
                    total,
                    percent: Math.round(((i + 1) / total) * 100),
                    done: i === total - 1,
                });
                i++;
                await new Promise(r => setImmediate(r)); // beri napas event loop
            }
        }
        i++;
    });

    // simpan hasil JSON
    log("parsing finished - saving file")
    
    try {
        const oldBookmarks = JSON.parse(fs.readFileSync(path.join(resultDir, "bookmark.json")));
        // const totalBookmarks = [...oldBookmarks, ...results];

        // Gabungkan dan hapus duplikat berdasarkan URL
        const combined = [...oldBookmarks, ...results];
        const seen = new Set();
        const unique = combined.filter(item => {
            const normalizedUrl = item.url.trim().toLowerCase(); // normalisasi agar https/HTTP tidak beda
            if (seen.has(normalizedUrl)) return false;
            seen.add(normalizedUrl);
            return true;
        });

        fs.writeFileSync(path.join(resultDir, "bookmark.json"), JSON.stringify(unique, null, 2));

        log("parsing completed")

        await build(unique, resultDir);
    } catch (err) {

        const combined = results;
        const seen = new Set();
        const unique = combined.filter(item => {
            const normalizedUrl = item.url.trim().toLowerCase(); // normalisasi agar https/HTTP tidak beda
            if (seen.has(normalizedUrl)) return false;
            seen.add(normalizedUrl);
            return true;
        });

        fs.writeFileSync(path.join(resultDir, "bookmark.json"), JSON.stringify(unique, null, 2));

        log("parsing completed")

        await build(unique, resultDir);
    }


}

async function build(results, resultDir) {
    log("indexing started")

    const builder = new lunr.Builder();

    builder.ref("url");
    builder.field("title");
    builder.field("url");

    const total = results.length;
    results.forEach((doc, counter) => {
        builder.add(doc);
        if (counter % 500 === 0 || counter === total - 1) {
            parentPort.postMessage({
                current: counter + 1,
                total,
                percent: Math.round(((counter + 1) / total) * 100),
                done: counter === total - 1,
            });
        }
    });

    const idx = builder.build();

    log("indexing finished - saving file")
    fs.writeFileSync(path.join(resultDir, "index.json"), JSON.stringify(idx, null, 2));
    // fs.writeFileSync(global.indexPath, JSON.stringify(idx, null, 2));
    log("indexing completed")

}

function log(msg) {
    parentPort.postMessage({
        phase: "log",
        message: msg,
        time: new Date().toISOString()
    });
}

parse();
