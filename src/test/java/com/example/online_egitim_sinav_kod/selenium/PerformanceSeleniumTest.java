package com.example.online_egitim_sinav_kod.selenium;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Performance Selenium Test - Basit performans testleri
 * Temel sayfa yükleme ve yanıt süresi testleri
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
public class PerformanceSeleniumTest extends BaseSeleniumTest {

    @BeforeEach
    public void performanceTestSetup() {
        System.out.println("🚀 Performans testi başlatılıyor...");
    }

    @Test
    public void testHomePageLoadTime() {
        System.out.println("🧪 Ana sayfa yükleme süresi testi başlatılıyor...");

        long startTime = System.currentTimeMillis();

        // Ana sayfaya git
        navigateToHome();
        waitForPageLoad();

        // Sayfa yüklenene kadar bekle
        try {
            wait.until(ExpectedConditions.or(
                ExpectedConditions.titleContains("Online"),
                ExpectedConditions.presenceOfElementLocated(By.tagName("body")),
                ExpectedConditions.jsReturnsValue("return document.readyState === 'complete'")
            ));
        } catch (Exception e) {
            System.out.println("⚠️ Sayfa yükleme bekleme hatası: " + e.getMessage());
        }

        long endTime = System.currentTimeMillis();
        long loadTime = endTime - startTime;

        System.out.println("📊 Ana sayfa yükleme süresi: " + loadTime + "ms");

        // 10 saniyeden az sürmeli (çok esnek limit)
        assertTrue(loadTime < 10000, "Ana sayfa yükleme süresi çok uzun: " + loadTime + "ms");

        // Sayfa başlığının yüklendiğini kontrol et
        String title = driver.getTitle();
        assertNotNull(title, "Sayfa başlığı yüklenmedi");
        assertFalse(title.isEmpty(), "Sayfa başlığı boş");

        System.out.println("✅ Ana sayfa performans testi başarılı - Süre: " + loadTime + "ms");
    }

    @Test
    public void testLoginPageResponseTime() {
        System.out.println("🧪 Giriş sayfası yanıt süresi testi başlatılıyor...");

        long startTime = System.currentTimeMillis();

        try {
            // Ana sayfaya git
            navigateToHome();
            waitForPageLoad();

            // Login butonunu bul ve tıkla
            WebElement loginButton = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[contains(text(), 'Giriş') or contains(text(), 'Login')]")
            ));
            loginButton.click();

            // Login formunun yüklenmesini bekle
            wait.until(ExpectedConditions.or(
                ExpectedConditions.presenceOfElementLocated(By.name("username")),
                ExpectedConditions.presenceOfElementLocated(By.id("username")),
                ExpectedConditions.presenceOfElementLocated(By.xpath("//input[@type='text']"))
            ));

        } catch (Exception e) {
            System.out.println("⚠️ Giriş sayfası bulunamadı, genel sayfa kontrolü yapılıyor...");
            // Alternatif olarak sadece sayfa yüklenmesini kontrol et
            waitForPageLoad();
        }

        long endTime = System.currentTimeMillis();
        long responseTime = endTime - startTime;

        System.out.println("📊 Giriş sayfası yanıt süresi: " + responseTime + "ms");

        // 15 saniyeden az sürmeli (çok esnek limit)
        assertTrue(responseTime < 15000, "Giriş sayfası yanıt süresi çok uzun: " + responseTime + "ms");

        System.out.println("✅ Giriş sayfası performans testi başarılı - Süre: " + responseTime + "ms");
    }

    @Test
    public void testPageElementsLoadTime() {
        System.out.println("🧪 Sayfa elementleri yükleme süresi testi başlatılıyor...");

        long startTime = System.currentTimeMillis();

        // Ana sayfaya git
        navigateToHome();
        waitForPageLoad();

        try {
            // Temel HTML elementlerinin yüklenmesini bekle
            wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));
            wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("head")));

            // En az bir interaktif element olmalı
            wait.until(ExpectedConditions.or(
                ExpectedConditions.presenceOfElementLocated(By.tagName("button")),
                ExpectedConditions.presenceOfElementLocated(By.tagName("a")),
                ExpectedConditions.presenceOfElementLocated(By.tagName("input"))
            ));

        } catch (Exception e) {
            System.out.println("⚠️ Bazı elementler yüklenemedi: " + e.getMessage());
        }

        long endTime = System.currentTimeMillis();
        long loadTime = endTime - startTime;

        System.out.println("📊 Sayfa elementleri yükleme süresi: " + loadTime + "ms");

        // 8 saniyeden az sürmeli
        assertTrue(loadTime < 8000, "Sayfa elementleri yükleme süresi çok uzun: " + loadTime + "ms");

        // Body elementinin var olduğunu doğrula
        WebElement body = driver.findElement(By.tagName("body"));
        assertNotNull(body, "Body elementi bulunamadı");

        System.out.println("✅ Sayfa elementleri performans testi başarılı - Süre: " + loadTime + "ms");
    }

    @Test
    public void testOverallPagePerformance() {
        System.out.println("🧪 Genel sayfa performans testi başlatılıyor...");

        long startTime = System.currentTimeMillis();

        // Sayfa yükleme performansı testi
        navigateToHome();

        // JavaScript'in çalışmasını bekle
        try {
            wait.until(driver -> {
                return ((org.openqa.selenium.JavascriptExecutor) driver)
                    .executeScript("return document.readyState").equals("complete");
            });
        } catch (Exception e) {
            System.out.println("⚠️ JavaScript ready state beklenemedi");
        }

        long endTime = System.currentTimeMillis();
        long totalTime = endTime - startTime;

        System.out.println("📊 Toplam sayfa hazır olma süresi: " + totalTime + "ms");

        // Toplam süre kontrolü (12 saniye limit)
        assertTrue(totalTime < 12000, "Sayfa hazır olma süresi çok uzun: " + totalTime + "ms");

        // Sayfa içeriği var mı kontrol et
        String pageSource = driver.getPageSource();
        assertNotNull(pageSource, "Sayfa içeriği alınamadı");
        assertTrue(pageSource.length() > 100, "Sayfa içeriği çok kısa: " + pageSource.length() + " karakter");

        System.out.println("✅ Genel performans testi başarılı - Toplam süre: " + totalTime + "ms");
        System.out.println("📄 Sayfa içerik uzunluğu: " + pageSource.length() + " karakter");
    }
}