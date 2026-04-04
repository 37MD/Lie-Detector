const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('path/to/your/LieDetector.html');

    // Extract fund names and alert text
    const results = await page.evaluate(() => {
        const fundNames = Array.from(document.querySelectorAll('.fund-name')).map(el => el.innerText);
        const alertTexts = Array.from(document.querySelectorAll('.alert-text')).map(el => el.innerText);
        return { fundNames, alertTexts };
    });

    // Saving results to alerts.json
    fs.writeFileSync('alerts.json', JSON.stringify(results, null, 2));

    await browser.close();
});
