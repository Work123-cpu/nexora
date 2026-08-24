package com.nexora.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/** Bounded executor for @Async calls (currently: material classification fired on raw material
 * creation) — a CSV bulk import can fire dozens of these at once, each a Groq round-trip via
 * ai-service, so a named bounded pool is used instead of Spring's default unbounded
 * SimpleAsyncTaskExecutor. */
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "materialIntelligenceExecutor")
    public TaskExecutor materialIntelligenceExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("material-intel-");
        executor.initialize();
        return executor;
    }
}
