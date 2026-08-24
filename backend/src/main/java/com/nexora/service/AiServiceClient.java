package com.nexora.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Optional;

/**
 * The backend's first call to the Python ai-service (the frontend already calls it directly for
 * other features; this is the first server-to-server integration). Same style as
 * MarketDataService — plain JDK HttpClient, no new dependency. Every method returns
 * Optional.empty() on any failure (timeout, non-200, malformed JSON) rather than throwing: an
 * unstarted/down ai-service must never break raw material creation or the daily scheduled job.
 */
@Service
public class AiServiceClient {

    private final String baseUrl;
    // uvicorn (ai-service's dev server) is HTTP/1.1-only — JDK's HttpClient defaults to HTTP/2
    // with an upgrade attempt that uvicorn's parser rejects outright ("Invalid HTTP request
    // received."), so HTTP/1.1 must be forced explicitly.
    private final HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiServiceClient(@Value("${nexora.ai-service.base-url}") String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public record ClassifyResult(String category, String referenceCommodity) {}

    public record IndicatorResult(String trend, String confidence, String reasoning) {}

    public Optional<ClassifyResult> classify(String materialName, String userCategory, String unit) {
        try {
            var body = objectMapper.createObjectNode()
                    .put("materialName", materialName)
                    .put("materialCategory", userCategory)
                    .put("unit", unit);
            JsonNode root = post("/api/ai/material-classify", objectMapper.writeValueAsString(body));
            if (root == null) return Optional.empty();
            String category = root.path("category").asText(null);
            if (category == null) return Optional.empty();
            String referenceCommodity = root.hasNonNull("referenceCommodity") ? root.get("referenceCommodity").asText() : null;
            return Optional.of(new ClassifyResult(category, referenceCommodity));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public Optional<IndicatorResult> indicator(String materialName, String category, String referenceCommodity) {
        try {
            var body = objectMapper.createObjectNode()
                    .put("materialName", materialName)
                    .put("category", category)
                    .put("referenceCommodity", referenceCommodity);
            JsonNode root = post("/api/ai/price-indicator", objectMapper.writeValueAsString(body));
            if (root == null) return Optional.empty();
            String trend = root.path("trend").asText(null);
            String confidence = root.path("confidence").asText(null);
            String reasoning = root.path("reasoning").asText("");
            if (trend == null || confidence == null) return Optional.empty();
            return Optional.of(new IndicatorResult(trend, confidence, reasoning));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private JsonNode post(String path, String jsonBody) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl + path))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return null;
            return objectMapper.readTree(response.body());
        } catch (Exception e) {
            return null;
        }
    }
}
