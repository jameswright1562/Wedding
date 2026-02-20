import { desserts, mains, sorbets, starters } from "./menu-data";

export function MenuSection() {
  return (
    <>
      <section className="invite__menu">
        <h2 className="section-title">Wedding Menu</h2>
        <p className="section-subtitle">
          Kindly select your meal choices below
        </p>
        <div className="menu-grid">
          <div className="menu-column">
            <h3>Starters</h3>
            <ul>
              {starters.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="menu-column">
            <h3>Sorbet</h3>
            <ul>
              {sorbets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="menu-column">
        <h3>Main Courses</h3>
        <ul>
          {mains.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="menu-column">
          <h3>Desserts</h3>
          <ul>
            {desserts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
