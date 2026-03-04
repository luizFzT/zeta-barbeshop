import puppeteer from 'puppeteer';

(async () => {
    console.log('Starting puppeteer to capture mobile mockups...');

    // Launch headless browser
    const browser = await puppeteer.launch({
        headless: "new"
    });

    const page = await browser.newPage();

    // Set viewport to iPhone 13 Pro size for flawless mobile proportions (390x844)
    await page.setViewport({
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });

    const DOMAIN = 'http://localhost:5173';

    try {
        // 1. Mockup 1: Client Services Page (Wait Time Selection)
        // Accessing the queue join flow by forcing the URL
        console.log('Capturing Mockup 1 (Services/Queue Join)...');
        await page.goto(`${DOMAIN}/queue/demo`, { waitUntil: 'networkidle0' });

        // Wait for elements to definitely load
        await new Promise(r => setTimeout(r, 1500));

        // Take screenshot of the exact viewport (what the user sees)
        await page.screenshot({ path: './public/images/mockup-1.png' });
        console.log('Mockup 1 saved!');

        // 2. Mockup 2: Client Queue Real-Time
        // We will mock joining the queue to see the timer screen
        console.log('Capturing Mockup 2 (Active Queue Timer)...');

        // We will just navigate to a state or try to click "Entrar na Fila" via guest
        // Wait for input
        const inputSelector = 'input[type="text"]';
        const isGuestInput = await page.$(inputSelector);

        if (isGuestInput) {
            await page.type(inputSelector, 'João Demo');
            await page.click('button.btn-primary.btn-block');

            // Wait for queue page to render the circle
            await new Promise(r => setTimeout(r, 2000));
            await page.screenshot({ path: './public/images/mockup-2.png' });
            console.log('Mockup 2 saved!');
        } else {
            console.log('Could not find input to mock join queue. Defaulting to standard view.');
            await page.screenshot({ path: './public/images/mockup-2.png' });
        }


        // 3. Mockup 3: Barber Dashboard
        console.log('Capturing Mockup 3 (Barber Dashboard)...');
        await page.goto(`${DOMAIN}/auth/login`, { waitUntil: 'networkidle0' });

        // Set demo auth in localStorage to bypass login
        await page.evaluate(() => {
            localStorage.setItem('auth_provider', 'demo');
            localStorage.setItem('auth_user', JSON.stringify({ name: 'Barbeiro Zeta', role: 'admin' }));
        });

        await page.goto(`${DOMAIN}/dashboard`, { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 2000));

        await page.screenshot({ path: './public/images/mockup-3.png' });
        console.log('Mockup 3 saved!');

    } catch (e) {
        console.error('Error capturing screenshots:', e);
    } finally {
        await browser.close();
        console.log('Done!');
    }
})();
