package com.example.online_egitim_sinav_kod.selenium;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;

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
        WebDriverManager.chromedriver().setup();

        ChromeOptions options = new ChromeOptions();
        // Chrome'u görünür modda çalıştır (debug için)
        // options.addArguments("--headless"); // Bu satırı kapatıyorum
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--disable-gpu");
        options.addArguments("--window-size=1200,800");
        options.addArguments("--disable-web-security");
        options.addArguments("--allow-running-insecure-content");

        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, Duration.ofSeconds(15));

        System.out.println("🚀 WebDriver başlatıldı: " + this.getClass().getSimpleName());
        System.out.println("🌐 Test URL: " + getBaseUrl());
    }

    @AfterEach
    public void tearDown() {
        if (driver != null) {
            driver.quit();
            System.out.println("✅ WebDriver kapatıldı: " + this.getClass().getSimpleName());
        }
    }

    protected void navigateToHome() {
        driver.get(getBaseUrl());
        waitForPageLoad();
    }

    protected void waitForPageLoad() {
        try {
            Thread.sleep(2000); // Sayfa yüklenmesi için kısa bekleme
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Test için güvenli element kontrol metodu
     */
    protected boolean isElementPresent(String xpath) {
        try {
            driver.findElement(org.openqa.selenium.By.xpath(xpath));
            return true;
        } catch (org.openqa.selenium.NoSuchElementException e) {
            return false;
        }
    }

    /**
     * Güvenli URL kontrol metodu
     */
    protected boolean urlContains(String text) {
        String currentUrl = driver.getCurrentUrl();
        return currentUrl != null && currentUrl.contains(text);
    }

    /**
     * Güvenli başlık kontrol metodu
     */
    protected boolean titleNotEmpty() {
        String title = driver.getTitle();
        return title != null && !title.isEmpty();
    }
}
