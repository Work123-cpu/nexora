package com.nexora.controller;

import com.nexora.entity.Notification;
import com.nexora.security.UserPrincipal;
import com.nexora.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public List<Notification> list(@AuthenticationPrincipal UserPrincipal principal) {
        return service.list(principal.companyId());
    }

    @PatchMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@AuthenticationPrincipal UserPrincipal principal, @PathVariable String id) {
        service.markRead(principal.companyId(), id);
    }

    @PostMapping("/mark-all-read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(@AuthenticationPrincipal UserPrincipal principal) {
        service.markAllRead(principal.companyId());
    }
}
