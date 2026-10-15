import Hero from '../components/home/Hero.jsx';
import CategoryArches from '../components/home/CategoryArches.jsx';
import FeaturedProducts from '../components/home/FeaturedProducts.jsx';
import Promise from '../components/home/Promise.jsx';
import VisitStore from '../components/home/VisitStore.jsx';

export default function Home() {
  return (
    <>
      <Hero />
      <CategoryArches />
      <FeaturedProducts />
      <Promise />
      <VisitStore />
    </>
  );
}
