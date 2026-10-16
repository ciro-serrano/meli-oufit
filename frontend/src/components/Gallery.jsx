import { useRef, useState } from "react";
import { thumb } from "../utils.js";

export default function Gallery({ images, alt }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);

  if (!images || images.length === 0) {
    return <div className="gallery-empty">Sin foto</div>;
  }

  // Calcula qué foto está a la vista según cuánto se desplazó
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goTo = (i) => {
    const el = trackRef.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="gallery">
      <div className="gallery-track" ref={trackRef} onScroll={onScroll}>
        {images.map((img, i) => (
          <div className="gallery-slide" key={img.id ?? i}>
            <img
              src={thumb(img.url, 900)}
              alt={`${alt} - foto ${i + 1}`}
              draggable="false"
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="thumbs">
          {images.map((img, i) => (
            <button
              key={img.id ?? i}
              type="button"
              className={`thumb ${i === index ? "active" : ""}`}
              aria-label={`Ver foto ${i + 1}`}
              onClick={() => goTo(i)}
            >
              <img src={thumb(img.url, 120)} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
