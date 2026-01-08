package com.example.online_egitim_sinav_kod.selenium;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Assumptions;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.htmlunit.HtmlUnitDriver;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.time.Duration;

/**
 * Tüm Selenium testleri için temel sınıf - Mevcut çalışan uygulamaya bağlanır
 */
public abstract class BaseSeleniumTest {

    protected WebDriver driver;
    protected WebDriverWait wait;

    // Mevcut çalışan uygulamanın URL'si - Frontend portu
    protected String getBaseUrl() {
        return System.getProperty("app.baseUrl", "http://localhost:5173");
    }

    @BeforeEach
    public void setUp() {
        try {
            // CI ortamında Selenium testlerinin çalışıp çalışmadığını kontrol et
            boolean isCiEnvironment = "true".equals(System.getenv("CI"));
            boolean skipSelenium = "true".equals(System.getProperty("skipSelenium"));

            if (skipSelenium) {
                Assumptions.assumeFalse(true, "Selenium testleri skipSelenium=true ile atlandı");
                return;
            }

            System.out.println("🔧 Selenium WebDriver kuruluyor...");
            System.out.println("🌍 CI Ortamı: " + isCiEnvironment);
            System.out.println("🖥️  İşletim Sistemi: " + System.getProperty("os.name"));
            System.out.println("🏗️  Mimari: " + System.getProperty("os.arch"));

            // Driver tipini belirle
            String seleniumDriver = System.getProperty("selenium.driver", "auto");
            System.out.println("🔧 Driver tipi: " + seleniumDriver);

            if ("htmlunit".equals(seleniumDriver)) {
                setupHtmlUnitDriver();
            } else if ("chrome".equals(seleniumDriver)) {
                setupChromeDriver();
            } else {
                // Auto mode: önce Chrome dene, başarısızsa HTMLUnit'e geç
                try {
                    setupChromeDriver();
                } catch (Exception e) {
                    System.out.println("⚠️  Chrome driver başarısız, HTMLUnit'e geçiliyor: " + e.getMessage());
                    setupHtmlUnitDriver();
                }
            }

            // WebDriverWait oluştur
            wait = new WebDriverWait(driver, Duration.ofSeconds(10));

            System.out.println("✅ WebDriver hazır: " + driver.getClass().getSimpleName());
            System.out.println("🌐 Base URL: " + getBaseUrl());

        } catch (Exception e) {
            System.err.println("❌ WebDriver kurulum hatası: " + e.getMessage());
            e.printStackTrace();

            // Test'i skip et
            Assumptions.assumeFalse(true, "WebDriver kurulum hatası: " + e.getMessage());
        }
    }

    private void setupHtmlUnitDriver() {
        System.out.println("🔧 HTMLUnit Driver kuruluyor...");

        // HTMLUnit Driver - Chrome'a bağımlılık yok, JavaScript destekli
        HtmlUnitDriver htmlUnitDriver = new HtmlUnitDriver(true); // JavaScript enabled

        // HTMLUnit için timeout ayarları
        htmlUnitDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
        htmlUnitDriver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(30));
        htmlUnitDriver.manage().timeouts().scriptTimeout(Duration.ofSeconds(30));

        this.driver = htmlUnitDriver;
        System.out.println("✅ HTMLUnit Driver hazır (JavaScript destekli)");
    }

    private void setupChromeDriver() {
        System.out.println("🔧 Chrome Driver kuruluyor...");
        boolean isCiEnvironment = "true".equals(System.getenv("CI"));

        // WebDriverManager ile Chrome driver'ı kur
        WebDriverManager.chromedriver().setup();

        ChromeOptions options = new ChromeOptions();

        // CI/CD ortamlarında headless mod zorunludur
        boolean headless = !"false".equalsIgnoreCase(System.getProperty("selenium.headless", "true"));
        if (headless || isCiEnvironment) {
            options.addArguments("--headless=new");
            System.out.println("🚫 Headless mod aktif");
        }

        // CI ortamları için kritik ayarlar
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--disable-gpu");
        options.addArguments("--disable-software-rasterizer");
        options.addArguments("--window-size=1200,800");
        options.addArguments("--disable-web-security");
        options.addArguments("--allow-running-insecure-content");
        options.addArguments("--disable-extensions");
        options.addArguments("--disable-background-timer-throttling");
        options.addArguments("--disable-backgrounding-occluded-windows");
        options.addArguments("--disable-renderer-backgrounding");
        options.addArguments("--disable-features=TranslateUI,VizDisplayCompositor");
        options.addArguments("--disable-ipc-flooding-protection");
        options.addArguments("--disable-blink-features=AutomationControlled");
        options.addArguments("--remote-debugging-port=0");

        // Docker/Container ortamları için
        options.addArguments("--disable-background-networking");
        options.addArguments("--disable-default-apps");
        options.addArguments("--disable-sync");
        options.addArguments("--metrics-recording-only");
        options.addArguments("--no-first-run");
        options.addArguments("--safebrowsing-disable-auto-update");
        options.addArguments("--disable-crash-reporter");
        options.addArguments("--disable-logging");
        options.addArguments("--disable-notifications");

        // DISPLAY environment variable'ı varsa kullan (Xvfb için)
        String display = System.getenv("DISPLAY");
        if (display != null && !display.isEmpty()) {
            System.out.println("🖼️  DISPLAY: " + display);
            options.addArguments("--display=" + display);
        }

        // Chrome binary path belirtimi
        String chromeBinary = System.getProperty("chrome.binary.path");
        if (chromeBinary != null && !chromeBinary.isEmpty()) {
            options.setBinary(chromeBinary);
            System.out.println("🌐 Chrome Binary: " + chromeBinary);
        } else if (isCiEnvironment) {
            // CI ortamlarında olası Chrome binary yolları
            String[] possiblePaths = {
                "/usr/bin/google-chrome",
                "/usr/bin/google-chrome-stable",
                "/usr/bin/chromium-browser",
                "/usr/bin/chromium"
            };

            for (String path : possiblePaths) {
                if (java.nio.file.Files.exists(java.nio.file.Paths.get(path))) {
                    options.setBinary(path);
                    System.out.println("🌐 Chrome Binary bulundu: " + path);
                    break;
                }
            }
        }

        // Chrome driver'ı oluştur
        this.driver = new ChromeDriver(options);

        // Timeout ayarları
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(30));
        driver.manage().timeouts().scriptTimeout(Duration.ofSeconds(30));

        System.out.println("✅ Chrome Driver hazır");
    }

    @AfterEach
    public void tearDown() {
        if (driver != null) {
            try {
                driver.quit();
                System.out.println("🔄 WebDriver kapatıldı");
            } catch (Exception e) {
                System.err.println("⚠️  WebDriver kapatma hatası: " + e.getMessage());
            }
        }
    }

    // Utility metodları...
    protected void waitForElement(By locator) {
        wait.until(ExpectedConditions.presenceOfElementLocated(locator));
    }

    protected void waitForElementClickable(By locator) {
        wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    protected void waitForElementVisible(By locator) {
        wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    protected void safeClick(By locator) {
        waitForElementClickable(locator);
        driver.findElement(locator).click();
    }

    protected void safeType(By locator, String text) {
        waitForElement(locator);
        WebElement element = driver.findElement(locator);
        element.clear();
        element.sendKeys(text);
    }

    protected boolean isElementPresent(By locator) {
        try {
            driver.findElement(locator);
            return true;
        } catch (NoSuchElementException e) {
            return false;
        }
    }

    protected void scrollToElement(By locator) {
        WebElement element = driver.findElement(locator);
        ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true);", element);
    }
}
