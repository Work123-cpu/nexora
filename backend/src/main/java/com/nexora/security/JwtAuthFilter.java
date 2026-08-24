package com.nexora.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.nexora.repository.CompanyRepository;
import com.nexora.repository.UserRepository;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;

    public JwtAuthFilter(JwtService jwtService, UserRepository userRepository, CompanyRepository companyRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                Claims claims = jwtService.parseClaims(token);
                String userId = claims.getSubject();
                String companyId = claims.get("companyId", String.class);
                String role = claims.get("role", String.class);

                // A cryptographically valid token can still name a user/company that was since
                // deleted from the database (e.g. a dev DB reset) — without this check, reads
                // would silently succeed with empty data while writes 500 on the FK constraint,
                // leaving the user in a half-logged-in state instead of being logged out.
                if (userRepository.existsById(userId) && companyRepository.existsById(companyId)) {
                    UserPrincipal principal = new UserPrincipal(userId, companyId, role);
                    var auth = new UsernamePasswordAuthenticationToken(
                            principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (JwtException | IllegalArgumentException ignored) {
                // invalid/expired token — leave request unauthenticated, entry point returns 401
            }
        }

        filterChain.doFilter(request, response);
    }
}
