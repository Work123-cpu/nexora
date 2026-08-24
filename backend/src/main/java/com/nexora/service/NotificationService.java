package com.nexora.service;

import com.nexora.entity.*;
import com.nexora.repository.CompanyRepository;
import com.nexora.repository.InventoryItemRepository;
import com.nexora.repository.MaterialPriceSnapshotRepository;
import com.nexora.repository.NotificationRepository;
import com.nexora.repository.PurchaseOrderRepository;
import com.nexora.repository.RawMaterialRepository;
import com.nexora.repository.VendorRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Single source of truth for low-stock/PO/vendor alerts — replaces what used to be three
 * independently-duplicated threshold checks scattered across the frontend. Sync methods are
 * idempotent upserts keyed by (companyId, entityType, entityId): re-running them never creates
 * duplicates, and a condition clearing (e.g. stock replenished) resolves the existing alert
 * instead of leaving it stuck open forever.
 *
 * Runs both on-demand (list() syncs before reading, so a page visit is always current) and on a
 * schedule (so the notification bell's polling stays current even when nobody is looking at the
 * page that would otherwise trigger a sync).
 */
@Service
public class NotificationService {

    private static final String ENTITY_INVENTORY_ITEM = "inventory-item";
    private static final String ENTITY_PURCHASE_ORDER = "purchase-order";
    private static final String ENTITY_VENDOR = "vendor";
    private static final String ENTITY_COMMODITY = "commodity";
    private static final String ENTITY_MATERIAL_PRICE = "material-price";

    // Matches frontend/src/lib/recommendation-engine/rules/marketImpact.rule.ts's thresholds —
    // same definition of "significant" on both sides of what used to be a client-only check.
    private static final double SIGNIFICANT_MOVE_PCT = 2.0;
    private static final double HIGH_MOVE_PCT = 6.0;

    private final NotificationRepository notifications;
    private final InventoryItemRepository inventoryItems;
    private final PurchaseOrderRepository purchaseOrders;
    private final VendorRepository vendors;
    private final CompanyRepository companies;
    private final MarketDataService marketData;
    private final RawMaterialRepository rawMaterials;
    private final MaterialPriceSnapshotRepository materialPriceSnapshots;

    public NotificationService(
            NotificationRepository notifications,
            InventoryItemRepository inventoryItems,
            PurchaseOrderRepository purchaseOrders,
            VendorRepository vendors,
            CompanyRepository companies,
            MarketDataService marketData,
            RawMaterialRepository rawMaterials,
            MaterialPriceSnapshotRepository materialPriceSnapshots
    ) {
        this.notifications = notifications;
        this.inventoryItems = inventoryItems;
        this.purchaseOrders = purchaseOrders;
        this.vendors = vendors;
        this.companies = companies;
        this.marketData = marketData;
        this.rawMaterials = rawMaterials;
        this.materialPriceSnapshots = materialPriceSnapshots;
    }

    public List<Notification> list(String companyId) {
        syncForCompany(companyId);
        return notifications.findByCompanyIdAndResolvedAtIsNullOrderByCreatedAtDesc(companyId);
    }

    public void markRead(String companyId, String id) {
        Notification n = notifications.findById(id).orElseThrow();
        if (!n.getCompanyId().equals(companyId)) throw new IllegalArgumentException("Notification not found: " + id);
        n.setRead(true);
        notifications.save(n);
    }

    public void markAllRead(String companyId) {
        List<Notification> open = notifications.findByCompanyIdAndResolvedAtIsNullOrderByCreatedAtDesc(companyId);
        for (Notification n : open) n.setRead(true);
        notifications.saveAll(open);
    }

    /** Every 5 minutes, for every company — the backstop that makes alerts genuinely automatic
     * even without anyone actively viewing a page (list() above already syncs on every read, so
     * in practice most syncing happens far more often than this via normal frontend polling). */
    @Scheduled(fixedRate = 5 * 60 * 1000)
    public void runScheduledSync() {
        for (Company company : companies.findAll()) {
            syncForCompany(company.getId());
        }
    }

    public void syncForCompany(String companyId) {
        syncLowStockAlerts(companyId);
        syncPurchaseOrderAlerts(companyId);
        syncVendorAlerts(companyId);
        syncMarketImpactAlerts(companyId);
        syncMaterialPriceAlerts(companyId);
    }

    private void syncLowStockAlerts(String companyId) {
        for (InventoryItem item : inventoryItems.findByCompanyId(companyId)) {
            if (item.getQuantityOnHand() <= item.getSafetyStock()) {
                upsert(companyId, ENTITY_INVENTORY_ITEM, item.getId(), NotificationCategory.INVENTORY, NotificationPriority.CRITICAL,
                        "Critical stock: " + item.getItemName(),
                        item.getItemName() + " has dropped below safety stock (" + item.getQuantityOnHand() + " " + item.getUnit()
                                + " on hand). Immediate reorder recommended.",
                        "/app/procurement/recommendations");
            } else if (item.getQuantityOnHand() <= item.getReorderPoint()) {
                upsert(companyId, ENTITY_INVENTORY_ITEM, item.getId(), NotificationCategory.INVENTORY, NotificationPriority.MEDIUM,
                        "Low stock warning: " + item.getItemName(),
                        item.getItemName() + " is approaching its reorder point. Consider placing a purchase order within the next few days.",
                        "/app/inventory");
            } else {
                resolveIfExists(companyId, ENTITY_INVENTORY_ITEM, item.getId());
            }
        }
    }

    private void syncPurchaseOrderAlerts(String companyId) {
        List<Vendor> companyVendors = vendors.findByCompanyId(companyId);
        for (PurchaseOrder po : purchaseOrders.findByCompanyId(companyId)) {
            boolean relevant = "in_transit".equals(po.getStatus()) || "received".equals(po.getStatus());
            if (!relevant) {
                resolveIfExists(companyId, ENTITY_PURCHASE_ORDER, po.getId());
                continue;
            }
            String vendorName = companyVendors.stream().filter(v -> v.getId().equals(po.getVendorId())).findFirst()
                    .map(Vendor::getName).orElse("vendor");
            boolean received = "received".equals(po.getStatus());
            upsert(companyId, ENTITY_PURCHASE_ORDER, po.getId(), NotificationCategory.PROCUREMENT, NotificationPriority.LOW,
                    received ? "Order received: " + po.getPoNumber() : "Shipment in transit: " + po.getPoNumber(),
                    received
                            ? po.getPoNumber() + " from " + vendorName + " has been received and inventory updated."
                            : po.getPoNumber() + " from " + vendorName + " is in transit, expected "
                              + (po.getExpectedDeliveryDate() != null ? po.getExpectedDeliveryDate() : "soon") + ".",
                    "/app/procurement/purchase-orders/" + po.getId());
        }
    }

    private void syncVendorAlerts(String companyId) {
        for (Vendor vendor : vendors.findByCompanyId(companyId)) {
            if ("under-review".equals(vendor.getStatus())) {
                upsert(companyId, ENTITY_VENDOR, vendor.getId(), NotificationCategory.VENDOR, NotificationPriority.HIGH,
                        "Vendor performance flagged: " + vendor.getName(),
                        vendor.getName() + " has an on-time delivery rate of " + vendor.getOnTimeDeliveryPct()
                                + "%, below the acceptable threshold. Review recommended.",
                        "/app/vendors/" + vendor.getId());
            } else {
                resolveIfExists(companyId, ENTITY_VENDOR, vendor.getId());
            }
        }
    }

    /** No-op (not even a resolve pass) when the company hasn't set an Alpha Vantage key — an
     * unconfigured integration isn't the same as "nothing changed," so existing alerts (if any,
     * e.g. left over from before a key was removed) are deliberately left alone rather than
     * silently resolved based on data we no longer have. */
    private void syncMarketImpactAlerts(String companyId) {
        Company company = companies.findById(companyId).orElse(null);
        if (company == null || company.getAlphaVantageApiKey() == null || company.getAlphaVantageApiKey().isBlank()) return;

        for (MarketDataService.MarketMove move : marketData.fetchMatchedCommodityMoves(companyId, company.getAlphaVantageApiKey())) {
            String entityId = move.def().function();
            if (Math.abs(move.changePct()) < SIGNIFICANT_MOVE_PCT) {
                resolveIfExists(companyId, ENTITY_COMMODITY, entityId);
                continue;
            }

            boolean rising = move.changePct() > 0;
            NotificationPriority priority = Math.abs(move.changePct()) >= HIGH_MOVE_PCT ? NotificationPriority.HIGH : NotificationPriority.MEDIUM;
            String direction = rising ? "risen" : "fallen";
            String advice = rising
                    ? "Consider buying ahead before it rises further."
                    : "This may be a good time to buy at the lower price.";

            upsert(companyId, ENTITY_COMMODITY, entityId, NotificationCategory.MARKET, priority,
                    move.def().label() + " has " + direction + " " + Math.abs(move.changePct()) + "%",
                    move.def().label() + " (" + move.value() + " " + move.def().unit() + ") has " + direction + " "
                            + Math.abs(move.changePct()) + "% — affects " + String.join(", ", move.matchedMaterials()) + ". " + advice,
                    "/app/market-intelligence");
        }
    }

    /** Mirrors syncMarketImpactAlerts above but reads MaterialPriceSnapshot.isSpike (set by
     * MaterialIntelligenceService.saveRealSnapshot's fixed % threshold — plain arithmetic, not an
     * AI judgment call) rather than calling MarketDataService again. Covers both REAL_PRICE and
     * INDICATOR_ONLY materials uniformly since isSpike is already resolved on the snapshot.
     * Public — also called explicitly by MaterialIntelligenceScheduler right after refreshing
     * each company's snapshots, so a spike surfaces immediately rather than waiting for the
     * independent 5-minute sync cron. */
    public void syncMaterialPriceAlerts(String companyId) {
        for (RawMaterial material : rawMaterials.findByCompanyId(companyId)) {
            Optional<MaterialPriceSnapshot> latest = materialPriceSnapshots
                    .findByRawMaterialIdOrderBySnapshotDateDesc(material.getId())
                    .stream().findFirst();

            if (latest.isEmpty() || !latest.get().isSpike()) {
                resolveIfExists(companyId, ENTITY_MATERIAL_PRICE, material.getId());
                continue;
            }

            MaterialPriceSnapshot snapshot = latest.get();
            boolean rising = snapshot.getTrend() == PriceTrend.RISING;
            String direction = rising ? "risen" : "fallen";
            String advice = rising
                    ? "Consider buying ahead before it rises further."
                    : "This may be a good time to buy at the lower price.";
            String priceText = snapshot.getPrice() != null
                    ? snapshot.getPrice() + (snapshot.getUnit() != null ? " " + snapshot.getUnit() : "")
                    : "an estimated level";

            upsert(companyId, ENTITY_MATERIAL_PRICE, material.getId(), NotificationCategory.MARKET, NotificationPriority.HIGH,
                    material.getName() + " price has " + direction + " sharply",
                    material.getName() + " (" + priceText + ") has " + direction + " sharply, per " + snapshot.getSource() + ". " + advice,
                    "/app/market-intelligence");
        }
    }

    /** Updates the existing open alert for this entity in place (so a PO's notification text
     * updates from "in transit" to "received" rather than duplicating), or creates a new one. */
    private void upsert(String companyId, String entityType, String entityId, NotificationCategory category,
                         NotificationPriority priority, String title, String message, String link) {
        Notification n = notifications.findByCompanyIdAndEntityTypeAndEntityIdAndResolvedAtIsNull(companyId, entityType, entityId)
                .orElseGet(Notification::new);
        boolean isNew = n.getCompanyId() == null;
        n.setCompanyId(companyId);
        n.setCategory(category);
        n.setPriority(priority);
        n.setTitle(title);
        n.setMessage(message);
        n.setEntityType(entityType);
        n.setEntityId(entityId);
        n.setLink(link);
        if (isNew) n.setRead(false);
        notifications.save(n);
    }

    private void resolveIfExists(String companyId, String entityType, String entityId) {
        Optional<Notification> existing = notifications.findByCompanyIdAndEntityTypeAndEntityIdAndResolvedAtIsNull(companyId, entityType, entityId);
        existing.ifPresent(n -> {
            n.setResolvedAt(Instant.now());
            notifications.save(n);
        });
    }
}
