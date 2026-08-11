package com.nexora.controller;

import com.nexora.dto.TeamMemberInput;
import com.nexora.dto.TeamMemberRoleInput;
import com.nexora.entity.User;
import com.nexora.security.UserPrincipal;
import com.nexora.service.TeamMemberService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Lets an Admin add and manage teammate accounts under their own company — the only way any
 * role besides Admin ever gets created, since registration always creates a fresh company + Admin. */
@RestController
@RequestMapping("/api/team")
@PreAuthorize("hasRole('ADMIN')")
public class TeamMemberController {

    private final TeamMemberService service;

    public TeamMemberController(TeamMemberService service) {
        this.service = service;
    }

    @GetMapping
    public List<User> list(@AuthenticationPrincipal UserPrincipal principal) {
        return service.list(principal.companyId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public User create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody TeamMemberInput input) {
        return service.create(principal.companyId(), input);
    }

    @PutMapping("/{id}/role")
    public User updateRole(@AuthenticationPrincipal UserPrincipal principal, @PathVariable String id, @Valid @RequestBody TeamMemberRoleInput input) {
        return service.updateRole(principal.companyId(), principal.userId(), id, input);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable String id) {
        service.delete(principal.companyId(), principal.userId(), id);
    }
}
