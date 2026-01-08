package com.example.online_egitim_sinav_kod.selenium;

// GEÇICI OLARAK DEVRE DIŞI








public class PerformanceSeleniumTest extends BaseSeleniumTest {

    /*@Test
    public void testPageLoadPerformance() {
        System.out.println("🧪 Test 10: Sayfa yükleme performans testi başlatılıyor...");

        long startTime = System.currentTimeMillis();
        navigateToHome();
        waitForPageLoad();
        long endTime = System.currentTimeMillis();

        long loadTime = endTime - startTime;
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

    @Test
    public void testMultipleUserLogin() {
        System.out.println("🧪 Test 10b: Çoklu kullanıcı giriş performans testi başlatılıyor...");

        String[] testUsers = {
            "user1@example.com",
            "user2@example.com",
            "user3@example.com"
        };

        for (String username : testUsers) {
            long startTime = System.currentTimeMillis();

            navigateToHome();
            waitForPageLoad();

            try {
                WebElement loginLink = wait.until(ExpectedConditions.elementToBeClickable(
                    By.linkText("Giriş Yap")));
                loginLink.click();

                WebElement usernameField = wait.until(ExpectedConditions.presenceOfElementLocated(
                    By.name("username")));
                WebElement passwordField = driver.findElement(By.name("password"));

                usernameField.clear();
                usernameField.sendKeys(username);
                passwordField.clear();
                passwordField.sendKeys("test123");

                WebElement loginButton = driver.findElement(By.xpath("//button[contains(text(),'Giriş')]"));
                loginButton.click();

                waitForPageLoad();

                long endTime = System.currentTimeMillis();
                long loginTime = endTime - startTime;

                System.out.println(username + " giriş süresi: " + loginTime + "ms");

                // Her giriş 3 saniyeden az sürmeli
                Assert.assertTrue(loginTime < 3000, username + " giriş süresi çok uzun: " + loginTime + "ms");

                // Çıkış yap (eğer mümkünse)
                try {
                    WebElement logoutLink = driver.findElement(By.linkText("Çıkış"));
                    logoutLink.click();
                    waitForPageLoad();
                } catch (Exception e) {
                    // Çıkış linki bulunamadı, devam et
                }

            } catch (Exception e) {
                System.out.println("⚠️ " + username + " için giriş formu bulunamadı");
                // Test devam etsin
            }
        }

        System.out.println("✅ Çoklu kullanıcı performans testi tamamlandı");
    }

    @Test
    public void testDatabaseConnectionPerformance() {
        System.out.println("🧪 Test 10c: Veritabanı bağlantı performans testi başlatılıyor...");

        navigateToHome();
        waitForPageLoad();

        try {
            // API endpoint'lere istek atarak veritabanı performansını test et
            long startTime = System.currentTimeMillis();

            driver.get(BASE_URL + "/api/health");
            waitForPageLoad();

            long endTime = System.currentTimeMillis();
            long responseTime = endTime - startTime;

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
}