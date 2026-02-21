function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ArrowBanner() {
  return (
    <div className="arrow-banner">
      <span>Choose your meal options</span>
      <div className="arrow-row" onClick={() => window.scrollTo({
        behavior: "smooth",
        top: document.getElementById("rsvp-form")?.offsetTop,
      })}>
        <Arrow />
      </div>
    </div>
  );
}
