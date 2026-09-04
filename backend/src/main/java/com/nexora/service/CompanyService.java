package com.nexora.service;

import com.nexora.dto.CompanySettingsInput;
import com.nexora.entity.Company;
import com.nexora.entity.User;
import com.nexora.exception.ResourceNotFoundException;
import com.nexora.repository.CompanyRepository;
import com.nexora.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class CompanyService {

    private final CompanyRepository repository;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public CompanyService(CompanyRepository repository, UserRepository users, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    public Company getSettings(String companyId) {
        return repository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + companyId));
    }

    public Company updateSettings(String companyId, CompanySettingsInput input) {
        Company company = getSettings(companyId);
        company.setAlphaVantageApiKey(input.alphaVantageApiKey());
        company.setDataGovInApiKey(input.dataGovInApiKey());
        return repository.save(company);
    }

    /** Permanently deletes every user in this company. Removing the last one fires
     * trg_users_cascade_company (see CascadeIntegrityInitializer), which then deletes the
     * company itself and — via the real FK CASCADE chain — every product, raw material, BOM,
     * vendor, warehouse, purchase order, inventory record, bill, notification, and calendar
     * event tied to it. Irreversible; requires the acting admin's own password as confirmation
     * since there's no undo. */
    public void deleteCompany(String companyId, String actingUserId, String password) {
        User actingUser = users.findById(actingUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + actingUserId));
        if (!passwordEncoder.matches(password, actingUser.getPasswordHash())) {
            throw new IllegalArgumentException("Incorrect password.");
        }
        users.deleteAll(users.findByCompanyId(companyId));
    }
}
