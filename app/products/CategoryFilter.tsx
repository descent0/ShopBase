'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
}

const CategoryFilter = ({ categories }: CategoryFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategories = searchParams.get('categories')?.split(',').filter(Boolean) || [];

  const handleCategoryToggle = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    let newCategories: string[];
    if (selectedCategories.includes(category)) {
      newCategories = selectedCategories.filter(c => c !== category);
    } else {
      newCategories = [...selectedCategories, category];
    }

    if (newCategories.length > 0) {
      params.set('categories', newCategories.join(','));
    } else {
      params.delete('categories');
    }
    
    // Reset to page 1 when filter changes
    params.set('page', '1');
    
    router.push(`/products?${params.toString()}`);
  };

  const clearCategories = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('categories');
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Categories</CardTitle>
          {selectedCategories.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCategories}
              className="h-8 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category);
          return (
    
            <div key={category} className="flex items-center space-x-3">
                
              <Checkbox
                id={`category-${category}`}
                checked={isSelected}
                onCheckedChange={() => handleCategoryToggle(category)}
              />
              <label
                htmlFor={`category-${category}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer capitalize"
              >
                {category}
              </label>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default CategoryFilter;
