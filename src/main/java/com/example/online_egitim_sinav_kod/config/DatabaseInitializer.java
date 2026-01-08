package com.example.online_egitim_sinav_kod.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Database initialization and constraint management
 */
@Component
@Profile("!test")
public class DatabaseInitializer {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseInitializer.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private Environment environment;

    @PostConstruct
    public void initializeDatabase() {
        try {
            logger.info("🔧 Database initialization started...");

            // Check if we're using file database
            String datasourceUrl = environment.getProperty("spring.datasource.url", "");

            if (datasourceUrl.contains("file:")) {
                logger.info("📁 File database detected: {}", datasourceUrl);
                handleExistingConstraints();
            } else {
                logger.info("💾 In-memory database detected");
            }

            logger.info("✅ Database initialization completed successfully");

        } catch (Exception e) {
            logger.warn("⚠️ Database initialization encountered issues (continuing): {}", e.getMessage());
            // Don't throw exception, let the application continue
        }
    }

    private void handleExistingConstraints() {
        try {
            // Get database info
            Integer tableCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'PUBLIC'",
                Integer.class);

            logger.info("📊 Found {} existing tables", tableCount);

            if (tableCount != null && tableCount > 0) {
                logger.info("🔄 Database already initialized, using existing structure");

                // Check constraint count
                Integer constraintCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.CONSTRAINTS WHERE CONSTRAINT_SCHEMA = 'PUBLIC'",
                    Integer.class);

                logger.info("🔗 Found {} existing constraints", constraintCount);
            }

        } catch (Exception e) {
            logger.debug("Database structure check failed (this is normal for new databases): {}", e.getMessage());
        }
    }
}
