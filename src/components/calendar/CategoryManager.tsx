import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { ChevronRight, Edit, Folder, FolderPlus, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for categories
const MOCK_CATEGORIES = [
  {
    id: "1",
    name: "Weddings",
    color: "#f472b6",
    icon: "cake",
    parent: null,
    children: [
      {
        id: "1-1",
        name: "Ceremonies",
        color: "#ec4899",
        icon: "heart",
        parent: "1"
      },
      {
        id: "1-2",
        name: "Receptions",
        color: "#db2777",
        icon: "glass",
        parent: "1"
      }
    ]
  },
  {
    id: "2",
    name: "Meetings",
    color: "#60a5fa",
    icon: "users",
    parent: null,
    children: [
      {
        id: "2-1",
        name: "Client Consultations",
        color: "#3b82f6",
        icon: "user",
        parent: "2"
      },
      {
        id: "2-2",
        name: "Vendor Meetings",
        color: "#2563eb",
        icon: "truck",
        parent: "2"
      }
    ]
  },
  {
    id: "3",
    name: "Deadlines",
    color: "#f97316",
    icon: "clock",
    parent: null,
    children: []
  },
  {
    id: "4",
    name: "Personal",
    color: "#a78bfa",
    icon: "user",
    parent: null,
    children: []
  }
];

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  parent: string | null;
  children?: Category[];
}

interface CategoryManagerProps {
  onClose: () => void;
}

const CategoryManager = ({ onClose }: CategoryManagerProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: "",
    color: "#f472b6",
    icon: "calendar",
    parent: null
  });

  // Add a new category
  const addCategory = () => {
    if (!newCategory.name) {
      toast({
        title: t('calendar.categories.nameRequired'),
        description: t('calendar.categories.pleaseEnterName'),
        variant: "destructive"
      });
      return;
    }

    const id = `${Date.now()}`;
    const category: Category = {
      id,
      name: newCategory.name,
      color: newCategory.color || "#f472b6",
      icon: newCategory.icon || "calendar",
      parent: newCategory.parent,
      children: []
    };

    if (newCategory.parent) {
      // Add as a child to parent category
      setCategories(prevCategories =>
        prevCategories.map(cat => {
          if (cat.id === newCategory.parent) {
            return {
              ...cat,
              children: [...(cat.children || []), { ...category, children: undefined }]
            };
          }
          return cat;
        })
      );
    } else {
      // Add as a top-level category
      setCategories(prevCategories => [...prevCategories, category]);
    }

    setNewCategory({
      name: "",
      color: "#f472b6",
      icon: "calendar",
      parent: null
    });
    setIsAddingCategory(false);

    toast({
      title: t('calendar.categories.categoryAdded'),
      description: t('calendar.categories.categoryAddedDescription'),
    });
  };

  // Update a category
  const updateCategory = () => {
    if (!selectedCategory) return;

    if (!selectedCategory.name) {
      toast({
        title: t('calendar.categories.nameRequired'),
        description: t('calendar.categories.pleaseEnterName'),
        variant: "destructive"
      });
      return;
    }

    setCategories(prevCategories => {
      // If it's a top-level category
      if (!selectedCategory.parent) {
        return prevCategories.map(cat =>
          cat.id === selectedCategory.id ? { ...cat, ...selectedCategory } : cat
        );
      }

      // If it's a child category
      return prevCategories.map(cat => {
        if (cat.children?.some(child => child.id === selectedCategory.id)) {
          return {
            ...cat,
            children: cat.children.map(child =>
              child.id === selectedCategory.id ? { ...child, ...selectedCategory } : child
            )
          };
        }
        return cat;
      });
    });

    setIsEditingCategory(false);
    setSelectedCategory(null);

    toast({
      title: t('calendar.categories.categoryUpdated'),
      description: t('calendar.categories.categoryUpdatedDescription'),
    });
  };

  // Delete a category
  const deleteCategory = (category: Category) => {
    if (!category.parent) {
      // Delete top-level category
      setCategories(prevCategories =>
        prevCategories.filter(cat => cat.id !== category.id)
      );
    } else {
      // Delete child category
      setCategories(prevCategories =>
        prevCategories.map(cat => {
          if (cat.id === category.parent) {
            return {
              ...cat,
              children: cat.children?.filter(child => child.id !== category.id)
            };
          }
          return cat;
        })
      );
    }

    toast({
      title: t('calendar.categories.categoryDeleted'),
      description: t('calendar.categories.categoryDeletedDescription'),
    });
  };

  // Edit a category
  const editCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsEditingCategory(true);
  };

  // Save all changes
  const saveChanges = () => {
    toast({
      title: t('calendar.categories.changesSaved'),
      description: t('calendar.categories.changesSavedDescription'),
    });
    onClose();
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>{t('calendar.categories.title')}</CardTitle>
        <CardDescription>{t('calendar.categories.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">{t('calendar.categories.categories')}</h3>
          <Button
            onClick={() => setIsAddingCategory(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('calendar.categories.addCategory')}
          </Button>
        </div>

        <div className="space-y-2">
          {categories.map(category => (
            <div key={category.id} className="space-y-2">
              <div
                className="flex items-center justify-between p-2 border rounded-md"
                style={{ borderLeftColor: category.color, borderLeftWidth: '4px' }}
              >
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" style={{ color: category.color }} />
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editCategory(category)}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">{t('common.edit')}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCategory(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">{t('common.delete')}</span>
                  </Button>
                </div>
              </div>

              {/* Subcategories */}
              {category.children && category.children.length > 0 && (
                <div className="ml-6 space-y-2">
                  {category.children.map(child => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between p-2 border rounded-md"
                      style={{ borderLeftColor: child.color, borderLeftWidth: '4px' }}
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4" />
                        <span>{child.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editCategory(child)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">{t('common.edit')}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCategory(child)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{t('common.delete')}</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Category Dialog */}
        <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('calendar.categories.addCategory')}</DialogTitle>
              <DialogDescription>
                {t('calendar.categories.addCategoryDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">{t('calendar.categories.name')}</Label>
                <Input
                  id="category-name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder={t('calendar.categories.namePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-color">{t('calendar.categories.color')}</Label>
                <div className="flex gap-2">
                  {['#f472b6', '#60a5fa', '#34d399', '#f97316', '#a78bfa'].map(color => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-8 h-8 rounded-full border-2",
                        newCategory.color === color ? "border-gray-900" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCategory({ ...newCategory, color })}
                    />
                  ))}
                  <Input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="w-8 h-8 p-0 overflow-hidden"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-parent">{t('calendar.categories.parent')}</Label>
                <Select
                  value={newCategory.parent || "none"}
                  onValueChange={(value) => setNewCategory({ ...newCategory, parent: value === "none" ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('calendar.categories.noParent')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('calendar.categories.noParent')}</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingCategory(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={addCategory}>
                {t('common.add')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={isEditingCategory} onOpenChange={setIsEditingCategory}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('calendar.categories.editCategory')}</DialogTitle>
              <DialogDescription>
                {t('calendar.categories.editCategoryDescription')}
              </DialogDescription>
            </DialogHeader>

            {selectedCategory && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category-name">{t('calendar.categories.name')}</Label>
                  <Input
                    id="edit-category-name"
                    value={selectedCategory.name}
                    onChange={(e) => setSelectedCategory({ ...selectedCategory, name: e.target.value })}
                    placeholder={t('calendar.categories.namePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-category-color">{t('calendar.categories.color')}</Label>
                  <div className="flex gap-2">
                    {['#f472b6', '#60a5fa', '#34d399', '#f97316', '#a78bfa'].map(color => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          "w-8 h-8 rounded-full border-2",
                          selectedCategory.color === color ? "border-gray-900" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedCategory({ ...selectedCategory, color })}
                      />
                    ))}
                    <Input
                      type="color"
                      value={selectedCategory.color}
                      onChange={(e) => setSelectedCategory({ ...selectedCategory, color: e.target.value })}
                      className="w-8 h-8 p-0 overflow-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsEditingCategory(false);
                setSelectedCategory(null);
              }}>
                {t('common.cancel')}
              </Button>
              <Button onClick={updateCategory}>
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={saveChanges}>
          {t('common.save')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CategoryManager;
