export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 rounded-2xl bg-surface-elevated px-3.5 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  )
}
