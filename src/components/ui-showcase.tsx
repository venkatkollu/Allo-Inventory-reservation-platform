import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function UIShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Inventory Reservation Platform
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Built with Next.js, Tailwind CSS & shadcn/ui
          </p>
        </div>

        {/* Demo Components Grid */}
        <div className="grid gap-6">
          {/* Button Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Various button styles and sizes</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="ghost">Ghost</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
            </CardContent>
          </Card>

          {/* Card Example */}
          <Card>
            <CardHeader>
              <CardTitle>Product Card</CardTitle>
              <CardDescription>Example card layout for inventory items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">
                  Premium Widget
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  High-quality widget with exceptional durability and performance.
                </p>
                <div className="flex gap-2 mb-4">
                  <Badge>In Stock</Badge>
                  <Badge variant="secondary">Popular</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Price</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-50">$99.99</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Available</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-50">12 units</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button className="flex-1">Reserve</Button>
              <Button variant="outline" className="flex-1">Details</Button>
            </CardFooter>
          </Card>

          {/* Form Example */}
          <Card>
            <CardHeader>
              <CardTitle>Search Inventory</CardTitle>
              <CardDescription>Find products by name or SKU</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Enter product name or SKU..." />
              <Input type="number" placeholder="Max price..." />
            </CardContent>
            <CardFooter>
              <Button className="w-full">Search</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Status Badges */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Status Indicators</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Badge>Available</Badge>
            <Badge variant="secondary">Reserved</Badge>
            <Badge variant="destructive">Out of Stock</Badge>
            <Badge variant="outline">Pending</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
