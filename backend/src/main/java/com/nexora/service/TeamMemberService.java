package com.nexora.service;

import com.nexora.dto.TeamMemberInput;
import com.nexora.dto.TeamMemberRoleInput;
import com.nexora.entity.Role;
import com.nexora.entity.User;
import com.nexora.exception.ResourceNotFoundException;
import com.nexora.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TeamMemberService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;

    public TeamMemberService(UserRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> list(String companyId) {
        return repository.findByCompanyId(companyId);
    }

    public User create(String companyId, TeamMemberInput input) {
        if (repository.existsByEmail(input.email())) {
            throw new IllegalArgumentException("An account with this email already exists");
        }
        User user = new User();
        user.setCompanyId(companyId);
        user.setName(input.name());
        user.setEmail(input.email());
        user.setPasswordHash(passwordEncoder.encode(input.password()));
        user.setRole(input.role());
        user.setJobTitle(input.jobTitle());
        return repository.save(user);
    }

    public User updateRole(String companyId, String actingUserId, String id, TeamMemberRoleInput input) {
        User user = get(companyId, id);
        if (user.getRole() == Role.ADMIN && input.role() != Role.ADMIN && lastAdmin(companyId)) {
            throw new IllegalArgumentException("Cannot change this role — they're the only Admin left on this team.");
        }
        user.setRole(input.role());
        return repository.save(user);
    }

    public void delete(String companyId, String actingUserId, String id) {
        User user = get(companyId, id);
        if (user.getId().equals(actingUserId)) {
            throw new IllegalArgumentException("You can't remove your own account.");
        }
        if (user.getRole() == Role.ADMIN && lastAdmin(companyId)) {
            throw new IllegalArgumentException("Cannot remove the only Admin on this team.");
        }
        repository.delete(user);
    }

    private boolean lastAdmin(String companyId) {
        return repository.countByCompanyIdAndRole(companyId, Role.ADMIN) <= 1;
    }

    private User get(String companyId, String id) {
        User user = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team member not found: " + id));
        if (!user.getCompanyId().equals(companyId)) {
            throw new ResourceNotFoundException("Team member not found: " + id);
        }
        return user;
    }
}
