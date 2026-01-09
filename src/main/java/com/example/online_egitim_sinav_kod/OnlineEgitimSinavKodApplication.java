package com.example.online_egitim_sinav_kod;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class OnlineEgitimSinavKodApplication {

    public static void main(String[] args) {
        SpringApplication.run(OnlineEgitimSinavKodApplication.class, args);
        system.out.println("Online Eğitim Sınav Kod Uygulaması Başladı!");
    }
}
