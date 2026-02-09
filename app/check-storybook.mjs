import { firefox } from 'playwright';

const STORYBOOK_URL = 'http://localhost:6006';

async function checkStorybook() {
  const browser = await firefox.launch({ headless: true });
  const page = await browser.newPage();
  const storyErrors = {};

  try {
    console.log('Fetching story list...');
    const response = await page.goto(`${STORYBOOK_URL}/index.json`, { timeout: 10000 });
    const data = await response.json();

    // Get all stories (atoms and molecules)
    const stories = Object.entries(data.entries || {})
      .filter(([id, entry]) => entry.type === 'story' && (id.includes('atoms') || id.includes('molecules')))
      .map(([id]) => id);

    console.log(`Checking ${stories.length} stories (atoms + molecules)...\n`);

    for (const storyId of stories) {
      const errors = [];

      const errorHandler = error => {
        if (!error.message.includes('ServiceWorker') && !error.message.includes('JSON.parse')) {
          errors.push(`[pageerror] ${error.message}`);
        }
      };

      const consoleHandler = msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (!text.includes('ServiceWorker') && !text.includes('favicon') && !text.includes('sw.js')) {
            errors.push(`[console] ${text}`);
          }
        }
      };

      page.on('pageerror', errorHandler);
      page.on('console', consoleHandler);

      try {
        await page.goto(`${STORYBOOK_URL}/iframe.html?id=${storyId}&viewMode=story`, {
          waitUntil: 'domcontentloaded',
          timeout: 5000
        });
        await page.waitForTimeout(1000);

        // Check for visible Storybook error display
        const errorInfo = await page.evaluate(() => {
          // Check for visible error display element
          const errorDisplay = document.querySelector('.sb-errordisplay');
          if (errorDisplay) {
            const style = window.getComputedStyle(errorDisplay);
            const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
            if (isVisible) {
              return { hasError: true, message: errorDisplay.innerText || 'Error display visible' };
            }
          }

          // Check for storybook error rendering
          const storyRoot = document.querySelector('#storybook-root, #root');
          if (storyRoot) {
            const content = storyRoot.innerText;
            if (content.includes('Error:') || content.includes('failed to render')) {
              return { hasError: true, message: content.substring(0, 300) };
            }
          }

          return { hasError: false, message: '' };
        }).catch(() => ({ hasError: false, message: '' }));


        if (errorInfo.hasError) {
          errors.push(errorInfo.message.substring(0, 200));
        }
      } catch (e) {
        if (!e.message.includes('Timeout')) {
          errors.push(e.message.substring(0, 100));
        }
      }

      page.off('pageerror', errorHandler);
      page.off('console', consoleHandler);

      if (errors.length > 0) {
        storyErrors[storyId] = errors;
        console.log(`❌ ${storyId.split('--')[1] || storyId}`);
        errors.forEach(e => console.log(`   ${e.substring(0, 120)}`));
      } else {
        console.log(`✓ ${storyId.split('--')[1] || storyId}`);
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }

  console.log(`\n========== Summary ==========`);
  console.log(`Failed: ${Object.keys(storyErrors).length}`);

  if (Object.keys(storyErrors).length > 0) {
    console.log(`\nFailed stories:`);
    Object.keys(storyErrors).forEach(id => console.log(`  - ${id}`));
  }
}

checkStorybook();
