package com.nexora.entity;

import jakarta.persistence.Embeddable;
import java.time.Instant;

@Embeddable
public class PurchaseOrderTimelineEvent {
    private String status;
    private Instant date;
    private String note;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getDate() { return date; }
    public void setDate(Instant date) { this.date = date; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
