package com.nexora.scheduler;

import com.nexora.entity.Company;
import com.nexora.entity.DataMode;
import com.nexora.entity.RawMaterial;
import com.nexora.entity.RawMaterialIntelligence;
import com.nexora.repository.CompanyRepository;
import com.nexora.repository.RawMaterialIntelligenceRepository;
import com.nexora.repository.RawMaterialRepository;
import com.nexora.service.MaterialIntelligenceService;
import com.nexora.service.NotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Once daily (6am IST — "check every morning"), for every company: classify anything still
 * PENDING (safety net for a failed async classify-on-create), refresh today's price/indicator
 * snapshot for every material, then sync material-price notifications so a detected spike shows
 * up in the bell without waiting for the independent 5-minute NotificationService cron. Mirrors
 * NotificationService.runScheduledSync()'s companies.findAll() loop pattern.
 */
@Service
public class MaterialIntelligenceScheduler {

    private final CompanyRepository companies;
    private final RawMaterialRepository rawMaterials;
    private final RawMaterialIntelligenceRepository intelligenceRepo;
    private final MaterialIntelligenceService materialIntelligenceService;
    private final NotificationService notificationService;

    public MaterialIntelligenceScheduler(
            CompanyRepository companies,
            RawMaterialRepository rawMaterials,
            RawMaterialIntelligenceRepository intelligenceRepo,
            MaterialIntelligenceService materialIntelligenceService,
            NotificationService notificationService
    ) {
        this.companies = companies;
        this.rawMaterials = rawMaterials;
        this.intelligenceRepo = intelligenceRepo;
        this.materialIntelligenceService = materialIntelligenceService;
        this.notificationService = notificationService;
    }

    @Scheduled(cron = "0 0 6 * * *", zone = "Asia/Kolkata")
    public void runDaily() {
        for (Company company : companies.findAll()) {
            runForCompany(company);
        }
    }

    public void runForCompany(Company company) {
        String companyId = company.getId();
        for (RawMaterial material : rawMaterials.findByCompanyId(companyId)) {
            RawMaterialIntelligence intel = intelligenceRepo.findByRawMaterialId(material.getId()).orElse(null);
            if (intel == null || intel.getDataMode() == DataMode.PENDING) {
                materialIntelligenceService.classifySync(material);
                intel = intelligenceRepo.findByRawMaterialId(material.getId()).orElse(null);
            }
            if (intel == null) continue; // ai-service still down — skip this material, retry tomorrow

            materialIntelligenceService.refreshSnapshot(material, intel, company);
        }
        notificationService.syncMaterialPriceAlerts(companyId);
    }
}
