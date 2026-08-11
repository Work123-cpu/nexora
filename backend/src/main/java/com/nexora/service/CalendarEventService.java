package com.nexora.service;

import com.nexora.dto.CalendarEventInput;
import com.nexora.entity.CalendarEvent;
import com.nexora.entity.CalendarEventType;
import com.nexora.exception.ResourceNotFoundException;
import com.nexora.repository.CalendarEventRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class CalendarEventService {

    private final CalendarEventRepository repository;

    public CalendarEventService(CalendarEventRepository repository) {
        this.repository = repository;
    }

    public List<CalendarEvent> list(String companyId) {
        return repository.findByCompanyId(companyId);
    }

    public CalendarEvent get(String companyId, String id) {
        CalendarEvent event = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Calendar event not found: " + id));
        if (!event.getCompanyId().equals(companyId)) {
            throw new ResourceNotFoundException("Calendar event not found: " + id);
        }
        return event;
    }

    public CalendarEvent create(String companyId, CalendarEventInput input) {
        CalendarEvent event = new CalendarEvent();
        event.setCompanyId(companyId);
        apply(event, input);
        return repository.save(event);
    }

    public CalendarEvent update(String companyId, String id, CalendarEventInput input) {
        CalendarEvent event = get(companyId, id);
        apply(event, input);
        return repository.save(event);
    }

    public void delete(String companyId, String id) {
        repository.delete(get(companyId, id));
    }

    private void apply(CalendarEvent event, CalendarEventInput input) {
        event.setTitle(input.title());
        event.setType(input.type());
        event.setDate(input.date());
        event.setEndDate(input.endDate());
        event.setDescription(input.description());
        event.setRelatedVendorId(input.relatedVendorId());
    }

    /** Only India's fixed-date gazetted national holidays — lunar-calendar festivals (Holi,
     * Diwali) shift every year and would need a real calendar library to get right, so they're
     * deliberately left out rather than shipping an approximate/wrong date. */
    public void seedDefaultHolidays(String companyId) {
        record FixedHoliday(String title, int month, int day, String description) {}
        List<FixedHoliday> holidays = List.of(
                new FixedHoliday("Republic Day", 1, 26, "National holiday — government offices and most suppliers closed."),
                new FixedHoliday("Labour Day", 5, 1, "National holiday observed across most Indian states."),
                new FixedHoliday("Independence Day", 8, 15, "National holiday — government offices and most suppliers closed."),
                new FixedHoliday("Gandhi Jayanti", 10, 2, "National holiday — government offices and most suppliers closed."),
                new FixedHoliday("Christmas", 12, 25, "National holiday — expect reduced logistics capacity.")
        );

        for (FixedHoliday h : holidays) {
            CalendarEvent event = new CalendarEvent();
            event.setCompanyId(companyId);
            event.setTitle(h.title());
            event.setType(CalendarEventType.GOVERNMENT_HOLIDAY);
            event.setDate(nextOccurrence(h.month(), h.day()));
            event.setDescription(h.description());
            repository.save(event);
        }
    }

    private Instant nextOccurrence(int month, int day) {
        LocalDate today = LocalDate.now();
        LocalDate candidate = LocalDate.of(today.getYear(), month, day);
        if (candidate.isBefore(today)) candidate = candidate.plusYears(1);
        return candidate.atStartOfDay(ZoneOffset.UTC).toInstant();
    }
}
