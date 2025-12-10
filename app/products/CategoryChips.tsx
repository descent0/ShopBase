'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface CategoryChipsProps {
  categories: string[];
}

const CategoryChips = ({ categories }: CategoryChipsProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategories = searchParams.get('categories')?.split(',').filter(Boolean) || [];

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (selectedCategories.includes(category)) {
      // Remove category
      const newCategories = selectedCategories.filter(c => c !== category);
      if (newCategories.length > 0) {
        params.set('categories', newCategories.join(','));
      } else {
        params.delete('categories');
      }
    } else {
      // Add category
      params.set('categories', [...selectedCategories, category].join(','));
    }
    
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  const handleShowAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('categories');
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="w-full overflow-x-auto mb-6 pb-2">
      <div className="flex items-center gap-2 min-w-max">
        <Badge
          variant={selectedCategories.length === 0 ? 'default' : 'outline'}
          className="cursor-pointer px-4 py-2 text-sm hover:bg-primary/80 transition-colors"
          onClick={handleShowAll}
        >
          All Products
        </Badge>
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category);
          return (
            <Badge
              key={category}
              variant={isSelected ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2 text-sm capitalize hover:bg-primary/80 transition-colors"
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryChips;
