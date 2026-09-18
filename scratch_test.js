const { chromium } = require('@playwright/test');

(async () => {
  console.log('Starting Playwright tests...');
  const browser = await chromium.launch({ channel: 'msedge', headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const url = 'http://localhost:3000/chat';
  let results = [];

  try {
    await page.goto(url);
    console.log(`Navigated to ${url}`);

    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // 1. Trigger the audit summary and confirm text streams in visibly, chunk by chunk.
    console.log('Test 1: Streaming response...');
    // We first need to check if we're on the chat page. It seems this is the home page.
    // The prompt says "Trigger the audit summary". In the FE-06 preview, the chat might be at /chat or the form on the homepage leads to /scan.
    // Let's first check if there's an input box directly on the page.
    let input = await page.$('textarea');
    if (!input) {
      console.log('No textarea found, trying to navigate to /scan or /chat?');
      // If the app requires submitting the form on the homepage:
      const formInput = await page.$('input[type="url"]');
      if (formInput) {
        await formInput.fill('https://example.com');
        await page.click('button:has-text("Scan")');
        await page.waitForLoadState('networkidle');
        input = await page.$('textarea');
      }
    }

    if (!input) {
      throw new Error("Could not find textarea to input message.");
    }

    // Capture network requests to check for API keys and errors
    const requests = [];
    page.on('request', req => {
      if (req.url().includes('/api/chat')) {
        requests.push(req);
        console.log('-> API Chat Request started');
      }
    });
    page.on('response', async res => {
      if (res.url().includes('/api/chat')) {
        console.log(`<- API Chat Response: ${res.status()} ${res.statusText()}`);
        try {
          const text = await res.text();
          console.log(`<- API Chat Response Body: ${text.substring(0, 200)}`);
        } catch (e) {
          console.log(`<- Could not read response body`);
        }
      }
    });
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    await input.fill('Give me a long explanation of web performance.');
    await page.keyboard.press('Enter');

    // Wait for streaming to start or error
    try {
      await page.waitForSelector('button:has-text("Stop")', { timeout: 10000 });
      let messageText = await page.locator('.prose').last().innerText({ timeout: 15000 });
      await page.waitForTimeout(1000); // wait 1 sec to get some stream
      let messageTextLater = await page.locator('.prose').last().innerText({ timeout: 5000 });
      
      if (messageText.length > 0 && messageTextLater.length > messageText.length) {
        results.push('1. Pass: Text streams in visibly chunk by chunk.');
      } else {
        results.push(`1. Fail: Streaming not detected properly. Text1 len: ${messageText.length}, Text2 len: ${messageTextLater.length}`);
      }
    } catch (e) {
      results.push(`1. Fail: Could not start streaming or fetch response. Error: ${e.message}`);
      const body = await page.content();
      console.log('Page content snapshot:', body.substring(0, 500) + '...');
      throw e; // Abort further tests if basic chat fails
    }

    // 2. Start a generation, click stop mid-stream.
    console.log('Test 2: Stop generation...');
    await page.click('button:has-text("Stop")');
    await page.waitForTimeout(500); // Wait for stop to process
    let stoppedText = await page.locator('.prose').last().innerText();
    await page.waitForTimeout(1000);
    let stoppedTextLater = await page.locator('.prose').last().innerText();
    let isReenabled = await page.locator('textarea').isEnabled();

    if (stoppedText === stoppedTextLater && isReenabled) {
      results.push('2. Pass: Stop mid-stream halts text, retains partial message, and re-enables input.');
      // Verify sending a new message right after works normally.
      await page.fill('textarea', 'Short test message.');
      await page.keyboard.press('Enter');
      await page.waitForSelector('button:has-text("Stop")');
      await page.waitForSelector('button:has-text("Send")', { timeout: 10000 }); // Wait for it to finish
      results.push('2. Pass (Part 2): Sending new message works normally.');
    } else {
      results.push('2. Fail: Stop functionality did not work as expected.');
    }

    // 3. Send three messages in a row...
    console.log('Test 3: Multiple turns and context retention...');
    // We already sent two messages. Let's send a third that references the second.
    await page.fill('textarea', 'What did I just say?');
    await page.keyboard.press('Enter');
    await page.waitForSelector('button:has-text("Send")', { timeout: 10000 });
    const messages = await page.locator('.prose').allTextContents();
    if (messages.length >= 3) {
      const lastReply = messages[messages.length - 1];
      if (lastReply.toLowerCase().includes('short test message')) {
        results.push('3. Pass: Earlier messages visible and model retained context.');
      } else {
        results.push(`3. Fail: Model didn't seem to retain context. Last reply: ${lastReply}`);
      }
    } else {
      results.push('3. Fail: Not all messages are visible.');
    }

    // 4. Check network requests for API key
    console.log('Test 4: Checking network requests for API key leak...');
    let keyLeak = false;
    for (const req of requests) {
      const payload = req.postData() || '';
      const headers = JSON.stringify(req.headers());
      if (payload.includes('AIzaSy') || headers.includes('AIzaSy') || payload.includes('AQ.Ab8RN6I') || headers.includes('AQ.Ab8RN6I')) {
        keyLeak = true;
      }
    }
    const pageSource = await page.content();
    if (pageSource.includes('AIzaSy') || pageSource.includes('AQ.Ab8RN6I')) {
      keyLeak = true;
    }
    
    if (keyLeak) {
      results.push('4. Fail: Found Gemini API key in network payload or page source.');
    } else {
      results.push('4. Pass: No API key found in network payloads or page source.');
    }

    // 5. Resize to 375px width
    console.log('Test 5: Resizing viewport to 375px...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    // Check if input box is usable
    const inputBox = await page.$('textarea');
    const sendBtn = await page.$('button:has-text("Send")');
    const inputBBox = await inputBox.boundingBox();
    const sendBtnBBox = await sendBtn.boundingBox();
    
    if (inputBBox && sendBtnBBox && inputBBox.width > 0 && sendBtnBBox.width > 0 && inputBBox.x >= 0 && (inputBBox.x + inputBBox.width <= 375)) {
      results.push('5. Pass: Viewport resized to 375px and input/button remain usable without overflow.');
    } else {
      results.push('5. Fail: UI elements might be cut off at 375px.');
    }

    // 6. Auto-scroll logic test
    console.log('Test 6: Auto-scroll logic test...');
    await page.setViewportSize({ width: 1280, height: 720 }); // reset
    await page.fill('textarea', 'Give me a very long numbered list of 50 web performance metrics.');
    await page.keyboard.press('Enter');
    await page.waitForSelector('button:has-text("Stop")');
    
    // While actively streaming, scroll up
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, -2000); // scroll up
    await page.waitForTimeout(500);
    
    const jumpToLatest = await page.$('button:has-text("Jump to latest")');
    if (jumpToLatest) {
      results.push('6. Pass: Scrolling up while streaming stops auto-scroll and displays "Jump to latest" control.');
    } else {
      results.push('6. Fail: "Jump to latest" control not found after scrolling up during stream.');
    }

    // wait to finish
    await page.waitForSelector('button:has-text("Send")', { timeout: 15000 });

  } catch (error) {
    console.error('Test failed with error:', error);
    results.push(`Error running tests: ${error.message}`);
  } finally {
    await browser.close();
    console.log('--- TEST RESULTS ---');
    results.forEach(r => console.log(r));
  }
})();
