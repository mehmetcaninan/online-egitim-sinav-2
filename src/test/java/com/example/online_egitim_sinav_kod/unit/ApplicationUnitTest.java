package com.example.online_egitim_sinav_kod.unit;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import com.example.online_egitim_sinav_kod.model.*;
import java.time.LocalDateTime;
import java.time.Instant;
import java.util.Arrays;

/**
 * Online Eğitim Sınav Sistemi Birim Testle
 * Gerçek proje bileşenlerini test eder
 */
public class ApplicationUnitTest {

    @Test
    @DisplayName("User Model Testi")
    void testUserModel() {
        // User nesnesinin doğru oluşturulduğunu test et
        User user = new User("testuser", "password123", "Test User", Role.STUDENT);

        assertEquals("testuser", user.getUsername());
        assertEquals("Test User", user.getFullName());
        assertEquals(Role.STUDENT, user.getRole());
        assertFalse(user.isApproved()); // Varsayılan olarak false olmalı
        assertNotNull(user.getCreatedAt());
    }

    @Test
    @DisplayName("Exam Model Testi")
    void testExamModel() {
        // Exam nesnesinin doğru oluşturulduğunu test et
        Exam exam = new Exam();
        exam.setTitle("Java Programlama Sınavı");
        exam.setDescription("Java temelleri sınavı");
        exam.setDuration(60); // 60 dakika
        exam.setStartTime(LocalDateTime.now().plusDays(1));
        exam.setEndTime(LocalDateTime.now().plusDays(1).plusHours(1));

        assertEquals("Java Programlama Sınavı", exam.getTitle());
        assertEquals("Java temelleri sınavı", exam.getDescription());
        assertEquals(60, exam.getDuration());
        assertTrue(exam.getIsActive()); // Varsayılan olarak true olmalı
        assertNotNull(exam.getCreatedAt());
    }

    @Test
    @DisplayName("Question Model Testi")
    void testQuestionModel() {
        // Question nesnesinin doğru oluşturulduğunu test et
        Question question = new Question();
        question.setText("Java'da String sınıfının hangi metodu string uzunluğunu döner?");
        question.setType(Question.QuestionType.MULTIPLE_CHOICE);
        question.setOptions("[\"length()\", \"size()\", \"count()\", \"getLength()\"]");
        question.setCorrectOptionIndex(0);
        question.setPoints(10.0);

        assertEquals("Java'da String sınıfının hangi metodu string uzunluğunu döner?", question.getText());
        assertEquals(Question.QuestionType.MULTIPLE_CHOICE, question.getType());
        assertEquals(0, question.getCorrectOptionIndex());
        assertEquals(10.0, question.getPoints());
        assertNotNull(question.getCreatedAt());
    }

    @Test
    @DisplayName("User Role Enum Testi")
    void testUserRoles() {
        // Role enum'ının doğru çalıştığını test et
        assertTrue(Arrays.asList(Role.values()).contains(Role.ADMIN));
        assertTrue(Arrays.asList(Role.values()).contains(Role.TEACHER)); // INSTRUCTOR yerine TEACHER
        assertTrue(Arrays.asList(Role.values()).contains(Role.STUDENT));
    }

    @Test
    @DisplayName("Question Type Enum Testi")
    void testQuestionTypes() {
        // QuestionType enum'ının doğru çalıştığını test et
        assertTrue(Arrays.asList(Question.QuestionType.values()).contains(Question.QuestionType.MULTIPLE_CHOICE));
        assertTrue(Arrays.asList(Question.QuestionType.values()).contains(Question.QuestionType.CLASSIC));
    }

    @Test
    @DisplayName("Sınav Süre Hesaplama Testi")
    void testExamDurationCalculation() {
        // Sınav süresinin doğru hesaplandığını test et
        Exam exam = new Exam();
        LocalDateTime start = LocalDateTime.of(2024, 1, 1, 10, 0);
        LocalDateTime end = LocalDateTime.of(2024, 1, 1, 11, 30);

        exam.setStartTime(start);
        exam.setEndTime(end);
        exam.setDuration(90); // 90 dakika

        assertEquals(90, exam.getDuration());
        assertTrue(exam.getEndTime().isAfter(exam.getStartTime()));
    }

    @Test
    @DisplayName("User Validation Testi")
    void testUserValidation() {
        // Kullanıcı doğrulama kurallarını test et
        User user = new User();
        user.setUsername("test@example.com");
        user.setPassword("password123");
        user.setFullName("Test User");
        user.setRole(Role.STUDENT);

        // Username boş olmamalı
        assertNotNull(user.getUsername());
        assertFalse(user.getUsername().isEmpty());

        // Password boş olmamalı
        assertNotNull(user.getPassword());
        assertFalse(user.getPassword().isEmpty());

        // Role atanmış olmalı
        assertNotNull(user.getRole());
    }

    @Test
    @DisplayName("Question Points Hesaplama Testi")
    void testQuestionPointsCalculation() {
        // Soru puanlarının doğru hesaplandığını test et
        Question q1 = new Question();
        q1.setPoints(5.0);

        Question q2 = new Question();
        q2.setPoints(10.0);

        Question q3 = new Question();
        q3.setPoints(15.0);

        // Toplam puan
        double totalPoints = q1.getPoints() + q2.getPoints() + q3.getPoints();
        assertEquals(30.0, totalPoints);

        // Her sorunun puanı pozitif olmalı
        assertTrue(q1.getPoints() > 0);
        assertTrue(q2.getPoints() > 0);
        assertTrue(q3.getPoints() > 0);
    }
}
