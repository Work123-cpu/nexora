package com.nexora.service;

import com.nexora.dto.CompanySettingsInput;
import com.nexora.entity.Company;
import com.nexora.exception.ResourceNotFoundException;
import com.nexora.repository.CompanyRepository;
import org.springframework.stereotype.Service;

@Service
public class CompanyService {

    private final CompanyRepository repository;

    public CompanyService(CompanyRepository repository) {
        this.repository = repository;
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
}
