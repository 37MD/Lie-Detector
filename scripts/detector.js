const puppeteer = require('puppeteer');

async function loadAlertData() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    try {
        // Load the live app URL
        await page.goto('https://37md.github.io/Lie-Detector/index.html', { waitUntil: 'domcontentloaded' });
        console.log('Page loaded successfully');

        // Extract the fund name
        const fundName = await page.$eval('.fund-name-tag', el => el.innerText);
        console.log(`Fund Name: ${fundName}`);

        // Extract alerts from multiple selectors
        const alerts = await Promise.all([
            page.$eval('#liveChartAlertBanner', el => el ? el.innerText : null),
            page.$eval('#alertBanner', el => el ? el.innerText : null),
            page.$eval('#liveAlertBanner', el => el ? el.innerText : null)
        ]);

        // Filter out any null values
        const extractedAlerts = alerts.filter(alert => alert !== null);
        console.log('Extracted Alerts:', extractedAlerts);

        // Save results to alerts.json
        const fs = require('fs');
        fs.writeFileSync('alerts.json', JSON.stringify({ fundName, extractedAlerts }, null, 2));
        console.log('Alerts saved to alerts.json');
    } catch (error) {
        console.error('Error extracting data:', error);
    } finally {
        await browser.close();
    }
}

loadAlertData();