package com.example.online_egitim_sinav_kod.selenium;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Assumptions;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
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
                    "/opt/google/chrome/chrome"
                };

                for (String path : possiblePaths) {
                    if (new java.io.File(path).exists()) {
                        options.setBinary(path);
                        System.out.println("🌐 Chrome Binary bulundu: " + path);
                        break;
                    }
                }
            }

            System.out.println("🚀 ChromeDriver başlatılıyor...");
            driver = new ChromeDriver(options);
            driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
            driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(30));

            wait = new WebDriverWait(driver, Duration.ofSeconds(15));

            System.out.println("✅ WebDriver başarıyla başlatıldı: " + this.getClass().getSimpleName());
            System.out.println("🌐 Test URL: " + getBaseUrl());

        } catch (Exception e) {
            System.err.println("❌ WebDriver kurulumu başarısız: " + e.getMessage());

            // CI ortamında Chrome kurulu değilse testi atla
            if ("true".equals(System.getenv("CI"))) {
                System.out.println("⚠️ CI ortamında Chrome başlatılamadı, test atlanıyor");
                Assumptions.assumeFalse(true, "CI ortamında Chrome başlatılamadı: " + e.getMessage());
            } else {
                throw e;
            }
        }
    }

    @AfterEach
    public void tearDown() {
        if (driver != null) {
            try {
                driver.quit();
                System.out.println("✅ WebDriver kapatıldı: " + this.getClass().getSimpleName());
            } catch (Exception e) {
                System.err.println("⚠️ WebDriver kapatılırken hata: " + e.getMessage());
            }
        }
    }

    protected void navigateToHome() {
        if (driver == null) {
            System.out.println("⚠️ WebDriver null, navigasyon atlanıyor");
            return;
        }

        driver.get(getBaseUrl());
        waitForPageLoad();
    }

    protected void waitForPageLoad() {
        try {
            Thread.sleep(1000); // Sayfa yüklenmesi için kısa bekleme
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    // ========================================
    // EKSİK METODLAR - COMPILATION HATALARINI ÇÖZ
    // ========================================

    /**
     * Element varlığını kontrol eder (CSS selector ile)
     */
    protected boolean isElementPresent(String cssSelector) {
        try {
            if (driver == null) return false;
            return !driver.findElements(By.cssSelector(cssSelector)).isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * URL'nin belirli bir metin içerip içermediğini kontrol eder
     */
    protected boolean urlContains(String text) {
        try {
            if (driver == null) return false;
            String currentUrl = driver.getCurrentUrl();
            return currentUrl != null && currentUrl.contains(text);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Element bulunmasını bekler (CSS selector ile)
     */
    protected WebElement waitForElement(String cssSelector) {
        try {
            return wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(cssSelector)));
        } catch (Exception e) {
            System.err.println("Element bulunamadı: " + cssSelector);
            return null;
        }
    }

    /**
     * Element tıklanabilir olmasını bekler
     */
    protected WebElement waitForElementToBeClickable(String cssSelector) {
        try {
            return wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(cssSelector)));
        } catch (Exception e) {
            System.err.println("Element tıklanabilir değil: " + cssSelector);
            return null;
        }
    }

    /**
     * URL değişimini bekler
     */
    protected boolean waitForUrlToContain(String text) {
        try {
            return wait.until(ExpectedConditions.urlContains(text));
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Element görünür olmasını bekler
     */
    protected boolean waitForElementVisible(String cssSelector) {
        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(cssSelector)));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Güvenli element tıklama
     */
    protected boolean safeClick(String cssSelector) {
        try {
            WebElement element = waitForElementToBeClickable(cssSelector);
            if (element != null) {
                element.click();
                return true;
            }
        } catch (Exception e) {
            System.err.println("Element tıklanamadı: " + cssSelector + " - " + e.getMessage());
        }
        return false;
    }

    /**
     * Güvenli metin yazma
     */
    protected boolean safeType(String cssSelector, String text) {
        try {
            WebElement element = waitForElement(cssSelector);
            if (element != null) {
                element.clear();
                element.sendKeys(text);
                return true;
            }
        } catch (Exception e) {
            System.err.println("Metin yazılamadı: " + cssSelector + " - " + e.getMessage());
        }
        return false;
    }

    /**
     * Element metnini güvenli bir şekilde alır
     */
    protected String safeGetText(String cssSelector) {
        try {
            WebElement element = waitForElement(cssSelector);
            return element != null ? element.getText() : "";
        } catch (Exception e) {
            return "";
        }
    }
}
