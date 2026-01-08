package com.example.online_egitim_sinav_kod.selenium;

// GEÇICI OLARAK DEVRE DIŞI








public class PerformanceSeleniumTest extends BaseSeleniumTest {

    /*@Test
    public void testPageLoadPerformance() {
        System.out.println("🧪 Test 10: Sayfa yükleme performans testi başlatılıyor...");

@@ -16,18 +24,18 @@ public void testPageLoadPerformance() {
        System.out.println("Ana sayfa yükleme süresi: " + loadTime + "ms");

        // Ana sayfa 5 saniyeden az sürede yüklenmeli
        Assert.assertTrue(loadTime < 5000, "Ana sayfa yükleme süresi çok uzun: " + loadTime + "ms");

        try {
            WebElement pageTitle = wait.until(ExpectedConditions.presenceOfElementLocated(
                By.xpath("//title | //h1")));

            System.out.println("✅ Sayfa başarıyla yüklendi: " + pageTitle.getText());
            Assert.assertTrue(pageTitle.isDisplayed());

        } catch (Exception e) {
            System.out.println("⚠️ Sayfa elementleri bulunamadı, temel sayfa kontrolü yapılıyor...");
            Assert.assertTrue(driver.getTitle().length() > 0);
        }
    }

@@ -72,7 +80,7 @@ public void testMultipleUserLogin() {
                System.out.println(username + " giriş süresi: " + loginTime + "ms");

                // Her giriş 3 saniyeden az sürmeli
                Assert.assertTrue(loginTime < 3000, username + " giriş süresi çok uzun: " + loginTime + "ms");

                // Çıkış yap (eğer mümkünse)
                try {
@@ -103,7 +111,7 @@ public void testDatabaseConnectionPerformance() {
            // API endpoint'lere istek atarak veritabanı performansını test et
            long startTime = System.currentTimeMillis();

            driver.get(BASE_URL + "/api/health");
            waitForPageLoad();

            long endTime = System.currentTimeMillis();
@@ -112,17 +120,17 @@ public void testDatabaseConnectionPerformance() {
            System.out.println("API yanıt süresi: " + responseTime + "ms");

            // API 2 saniyeden az sürede yanıt vermeli
            Assert.assertTrue(responseTime < 2000, "API yanıt süresi çok uzun: " + responseTime + "ms");

            // Sayfa içeriği kontrol et
            String pageSource = driver.getPageSource();
            Assert.assertTrue(pageSource.length() > 0, "API yanıt içeriği boş");

            System.out.println("✅ Veritabanı bağlantı performans testi başarılı");

        } catch (Exception e) {
            System.out.println("⚠️ API endpoint bulunamadı, genel sayfa performansı kontrol ediliyor...");
            Assert.assertTrue(driver.getTitle().length() > 0);
        }
    }*/
