import EmptyState from '../components/ui/EmptyState.jsx';

export default function NotFound() {
  return (
    <div className="container">
      <EmptyState title="This page is not here" text="The link may be old or mistyped. The collection is a good place to start." actionLabel="Go to the shop" actionTo="/shop" />
    </div>
  );
}
