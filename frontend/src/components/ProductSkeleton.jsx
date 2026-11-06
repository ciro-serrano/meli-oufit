export default function ProductSkeleton() {
  return (
    <div className="card" aria-hidden="true">
      <div className="card-img skeleton" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line short" />
    </div>
  );
}
