type InviteDate = {
  month: string;
  day: string;
  number: string;
  time: string;
  year: string;
};

export function InviteDetails({ date }: { date: InviteDate }) {
  return (
    <section className="invite__details">
      <p className="invite__month">{date.month}</p>
      <div className="invite__date">
        <span className="invite__day">{date.day}</span>
        <span className="invite__number">{date.number}</span>
        <span className="invite__time">{date.time}</span>
      </div>
      <p className="invite__year">{date.year}</p>
      <p className="invite__location">Abbey Hill Golf Course</p>
      <p className="invite__postcode">MK8 8AA</p>
      <p className="invite__rsvp">RSVP at 07435 047110</p>
    </section>
  );
}
