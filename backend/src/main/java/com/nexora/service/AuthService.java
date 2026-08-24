package com.nexora.service;

import com.nexora.dto.AuthResponse;
import com.nexora.dto.LoginRequest;
import com.nexora.dto.RegisterRequest;
import com.nexora.entity.Company;
import com.nexora.entity.Role;
import com.nexora.entity.User;
import com.nexora.repository.CompanyRepository;
import com.nexora.repository.UserRepository;
import com.nexora.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CalendarEventService calendarEventService;

    public AuthService(UserRepository userRepository, CompanyRepository companyRepository,
                        PasswordEncoder passwordEncoder, JwtService jwtService, CalendarEventService calendarEventService) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.calendarEventService = calendarEventService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        Company company = new Company();
        company.setName(req.companyName());
        companyRepository.save(company);

        User user = new User();
        user.setCompanyId(company.getId());
        user.setName(req.name());
        user.setEmail(req.email());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setRole(Role.ADMIN);
        userRepository.save(user);

        calendarEventService.seedDefaultHolidays(company.getId());

        String token = jwtService.generateToken(user.getId(), company.getId(), user.getRole().name());
        return new AuthResponse(token, user.getId(), company.getId(), user.getName(), user.getEmail(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email."));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Incorrect password.");
        }

        String token = jwtService.generateToken(user.getId(), user.getCompanyId(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getCompanyId(), user.getName(), user.getEmail(), user.getRole().name());
    }
}
