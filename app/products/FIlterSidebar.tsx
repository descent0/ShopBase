'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Filter } from 'lucide-react';
import CategoryFilter from './CategoryFilter';
import PriceFilter from './PriceFilter';

interface MobileFiltersProps {
  categories: string[];
  minPrice: number;
  maxPrice: number;
}

const MobileFilters = ({ categories, minPrice, maxPrice }: MobileFiltersProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="fixed left-4 top-22 z-50 shadow-lg">
          <Filter className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 sm:w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Refine your product search
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <CategoryFilter categories={categories} />
          <PriceFilter minPrice={minPrice} maxPrice={maxPrice} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileFilters;
