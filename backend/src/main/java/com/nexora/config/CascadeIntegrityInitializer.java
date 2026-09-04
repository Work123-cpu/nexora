package com.nexora.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Runs once per backend startup, after Hibernate's own ddl-auto has created/verified every
 * table, to add database-level cascade behavior JPA alone doesn't give this schema: every
 * business table stores its owner as a plain `company_id` string column (no @ManyToOne), so
 * Hibernate never generates a real foreign key for it. This adds those foreign keys with
 * ON DELETE CASCADE directly, upgrades the handful of foreign keys Hibernate DOES generate (for
 * @ElementCollection tables like bill line items) from their default NO ACTION to CASCADE too,
 * and adds one trigger so deleting a company's *last* user cascades *up* to their now-empty
 * company — real foreign keys only cascade downward (parent to children) on their own, so a
 * trigger is the only way to make "that was the last user" also clean up the orphaned company
 * and all its other data, which the CASCADE chain below then carries through automatically.
 *
 * Idempotent and self-healing, matching how ddl-auto:update already behaves for tables (proven
 * when restarting the backend alone recreated an accidentally-dropped table): safe to run on
 * every startup, and a failure here (e.g. genuinely orphaned company_id data blocking a
 * constraint) is logged rather than treated as fatal, so a data problem can't stop the app from
 * starting.
 *
 * Practical consequence, stated plainly because it's irreversible: deleting a user only wipes
 * their company if they were the LAST user in it. Removing one of several teammates (e.g. via
 * Team Members) just removes that one user — everyone else's data stays intact. This guard was
 * added after the original version cascaded on ANY user delete, which would have wiped a whole
 * multi-person company's data the first time someone removed a single teammate.
 */
@Component
public class CascadeIntegrityInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CascadeIntegrityInitializer.class);

    private record ExistingFk(String childTable, String childColumn, String parentTable) {}

    // Hibernate-generated foreign keys (for @ElementCollection tables) that default to NO ACTION
    // and need upgrading to CASCADE, or deleting their parent row would be blocked.
    private static final List<ExistingFk> ELEMENT_COLLECTION_FKS = List.of(
            new ExistingFk("bill_items", "bill_id", "bills"),
            new ExistingFk("bom_materials", "bom_id", "bills_of_materials"),
            new ExistingFk("purchase_order_items", "po_id", "purchase_orders"),
            new ExistingFk("purchase_order_timeline", "po_id", "purchase_orders"),
            new ExistingFk("vendor_materials_supplied", "vendor_id", "vendors")
    );

    // Every table that scopes its rows to a company via a plain `company_id` column.
    private static final List<String> COMPANY_SCOPED_TABLES = List.of(
            "users", "products", "raw_materials", "bills_of_materials", "purchase_orders",
            "inventory_items", "calendar_events", "vendors", "warehouses", "bills", "notifications"
    );

    private final JdbcTemplate jdbc;

    public CascadeIntegrityInitializer(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        for (ExistingFk fk : ELEMENT_COLLECTION_FKS) {
            ensureCascade(fk.childTable(), fk.childColumn(), fk.parentTable(), "id");
        }
        for (String table : COMPANY_SCOPED_TABLES) {
            ensureCascade(table, "company_id", "companies", "id");
        }
        ensureUserDeleteTrigger();
    }

    private void ensureCascade(String childTable, String childColumn, String parentTable, String parentColumn) {
        try {
            List<Map<String, Object>> existing = jdbc.queryForList(
                    "SELECT kcu.CONSTRAINT_NAME AS name, rc.DELETE_RULE AS deleteRule " +
                    "FROM information_schema.KEY_COLUMN_USAGE kcu " +
                    "JOIN information_schema.REFERENTIAL_CONSTRAINTS rc " +
                    "  ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME " +
                    "WHERE kcu.TABLE_SCHEMA = DATABASE() AND kcu.TABLE_NAME = ? AND kcu.COLUMN_NAME = ? " +
                    "  AND kcu.REFERENCED_TABLE_NAME = ?",
                    childTable, childColumn, parentTable);

            if (!existing.isEmpty()) {
                String deleteRule = String.valueOf(existing.get(0).get("deleteRule"));
                if ("CASCADE".equals(deleteRule)) return;
                String constraintName = String.valueOf(existing.get(0).get("name"));
                jdbc.execute("ALTER TABLE " + childTable + " DROP FOREIGN KEY " + constraintName);
                log.info("Dropped {} on {}.{} (was {}) to recreate with CASCADE", constraintName, childTable, childColumn, deleteRule);
            }

            String constraintName = "fk_" + childTable + "_" + childColumn + "_cascade";
            jdbc.execute("ALTER TABLE " + childTable + " ADD CONSTRAINT " + constraintName +
                    " FOREIGN KEY (" + childColumn + ") REFERENCES " + parentTable + "(" + parentColumn + ") ON DELETE CASCADE");
            log.info("Added ON DELETE CASCADE: {}.{} -> {}.{}", childTable, childColumn, parentTable, parentColumn);
        } catch (Exception e) {
            log.error("Could not ensure cascade delete for {}.{} -> {}.{} — leaving as-is. This usually means " +
                    "existing rows reference a {} row that no longer exists.",
                    childTable, childColumn, parentTable, parentColumn, parentTable, e);
        }
    }

    private void ensureUserDeleteTrigger() {
        try {
            jdbc.execute("DROP TRIGGER IF EXISTS trg_users_cascade_company");
            jdbc.execute(
                    "CREATE TRIGGER trg_users_cascade_company " +
                    "AFTER DELETE ON users FOR EACH ROW " +
                    "DELETE FROM companies WHERE id = OLD.company_id " +
                    "AND NOT EXISTS (SELECT 1 FROM users WHERE company_id = OLD.company_id)");
            log.info("Ensured trg_users_cascade_company: deleting a company's last remaining user now deletes the company too.");
        } catch (Exception e) {
            log.error("Could not create trg_users_cascade_company trigger — deleting a company's last user will NOT cascade to the company.", e);
        }
    }
}
