import asyncio
from playwright.async_api import async_playwright


async def take_screenshot(url: str, timeout: int = 30000) -> bytes:
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        try:
            page = await browser.new_page(viewport={"width": 1280, "height": 800})
            await page.goto(url, wait_until="domcontentloaded", timeout=timeout)
            await asyncio.sleep(1)
            screenshot = await page.screenshot(type="jpeg", quality=80)
            return screenshot
        finally:
            await browser.close()
