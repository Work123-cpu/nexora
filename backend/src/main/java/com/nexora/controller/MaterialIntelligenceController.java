package com.nexora.controller;

import com.nexora.dto.MaterialIntelligenceView;
import com.nexora.security.UserPrincipal;
import com.nexora.service.MaterialIntelligenceService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/market-intelligence")
public class MaterialIntelligenceController {

    private final MaterialIntelligenceService service;

    public MaterialIntelligenceController(MaterialIntelligenceService service) {
        this.service = service;
    }

    @GetMapping
    public List<MaterialIntelligenceView> get(@AuthenticationPrincipal UserPrincipal principal) {
        return service.getView(principal.companyId());
    }

    /** Manual refresh — bypasses the once-a-day cache so a newly-added API key (or a source that
     * was briefly down) takes effect immediately instead of waiting for tomorrow's scheduled run. */
    @PostMapping("/refresh")
    public List<MaterialIntelligenceView> refresh(@AuthenticationPrincipal UserPrincipal principal) {
        return service.refreshAll(principal.companyId());
    }
}
