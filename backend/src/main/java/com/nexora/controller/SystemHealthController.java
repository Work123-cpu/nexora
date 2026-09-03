package com.nexora.controller;

import com.nexora.dto.SystemHealthResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;

/** Feeds the frontend's Business Health "Database Health" card with a real, measured signal
 * instead of a hardcoded score — round-trips a real connection from the pool and reports
 * whether it validated and how long that took. */
@RestController
@RequestMapping("/api/system")
public class SystemHealthController {

    private final DataSource dataSource;

    public SystemHealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/health")
    public SystemHealthResponse health() {
        long start = System.nanoTime();
        boolean healthy;
        try (Connection connection = dataSource.getConnection()) {
            healthy = connection.isValid(2);
        } catch (Exception e) {
            healthy = false;
        }
        long latencyMs = (System.nanoTime() - start) / 1_000_000;
        return new SystemHealthResponse(healthy, latencyMs);
    }
}
