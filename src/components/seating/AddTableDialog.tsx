import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { TableShape, Table } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Circle, Square, RectangleHorizontal } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface AddTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  tables: Table[];
  preventCollisions?: boolean;
  checkCollision?: (table1: Table, table2: Table) => boolean;
  onTableAdded: () => void;
}

const tableFormSchema = z.object({
  name: z.string().min(1, "Table name is required"),
  shape: z.enum(["round", "rectangular", "square", "custom"] as const),
  capacity: z.number().min(1, "Capacity must be at least 1").max(20, "Capacity cannot exceed 20"),
  width: z.number().min(50, "Width must be at least 50").max(300, "Width cannot exceed 300"),
  height: z.number().min(50, "Height must be at least 50").max(300, "Height cannot exceed 300"),
});

type TableFormValues = z.infer<typeof tableFormSchema>;

const AddTableDialog = ({
  open,
  onOpenChange,
  clientId,
  tables,
  preventCollisions = true,
  checkCollision,
  onTableAdded
}: AddTableDialogProps) => {
  const { addTable } = useApp();
  const { t } = useTranslation();

  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: {
      name: "",
      shape: "round",
      capacity: 8,
      width: 120,
      height: 120,
    },
  });

  const watchShape = form.watch("shape");

  // Update width/height when shape changes
  const onShapeChange = (shape: TableShape) => {
    if (shape === "round" || shape === "square") {
      // For round and square tables, ensure width and height are equal
      const currentWidth = form.getValues("width");
      form.setValue("width", currentWidth);
      form.setValue("height", currentWidth);
    } else if (shape === "rectangular") {
      form.setValue("width", 180);
      form.setValue("height", 100);
    }
  };

  const onSubmit = async (values: TableFormValues) => {
    try {
      // Default position for new tables
      const positionX = 100;
      const positionY = 100;

      // Check for collisions if enabled
      if (preventCollisions && checkCollision) {
        const newTable = {
          id: 'temp-id', // Temporary ID for collision check
          clientId,
          name: values.name,
          shape: values.shape,
          width: values.width,
          height: values.height,
          capacity: values.capacity,
          positionX,
          positionY,
          rotation: 0,
        };

        // Check if the new table would collide with any existing table
        const hasCollision = tables.some(existingTable =>
          checkCollision(newTable, existingTable)
        );

        if (hasCollision) {
          toast.error(t("seating.tableOverlapError"));
          return;
        }
      }

      // Add the table if no collisions or collisions are allowed
      await addTable({
        clientId,
        name: values.name,
        shape: values.shape,
        width: values.width,
        height: values.height,
        capacity: values.capacity,
        positionX,
        positionY,
        rotation: 0,
      });

      form.reset();
      onTableAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding table:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Table</DialogTitle>
          <DialogDescription>
            Create a new table for your seating arrangement.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Table 1, Family Table, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shape"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table Shape</FormLabel>
                  <FormControl>
                    <RadioGroup
                      className="flex gap-4"
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        onShapeChange(value as TableShape);
                      }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <label
                          htmlFor="round"
                          className={`border rounded-md p-4 cursor-pointer hover:bg-muted/50 transition-colors ${field.value === 'round' ? 'bg-muted border-primary' : ''}`}
                        >
                          <Circle className="h-8 w-8 text-emerald-500" />
                        </label>
                        <RadioGroupItem value="round" id="round" className="sr-only" />
                        <span className="text-xs">Round</span>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <label
                          htmlFor="square"
                          className={`border rounded-md p-4 cursor-pointer hover:bg-muted/50 transition-colors ${field.value === 'square' ? 'bg-muted border-primary' : ''}`}
                        >
                          <Square className="h-8 w-8 text-blue-500" />
                        </label>
                        <RadioGroupItem value="square" id="square" className="sr-only" />
                        <span className="text-xs">Square</span>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <label
                          htmlFor="rectangular"
                          className={`border rounded-md p-4 cursor-pointer hover:bg-muted/50 transition-colors ${field.value === 'rectangular' ? 'bg-muted border-primary' : ''}`}
                        >
                          <RectangleHorizontal className="h-8 w-8 text-red-500" />
                        </label>
                        <RadioGroupItem value="rectangular" id="rectangular" className="sr-only" />
                        <span className="text-xs">Rectangular</span>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity: {field.value} guests</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={20}
                      step={1}
                      value={[field.value]}
                      onValueChange={(values) => field.onChange(values[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Width: {field.value}px</FormLabel>
                    <FormControl>
                      <Slider
                        min={50}
                        max={300}
                        step={10}
                        value={[field.value]}
                        onValueChange={(values) => {
                          field.onChange(values[0]);
                          // For round and square tables, keep width and height equal
                          if (watchShape === "round" || watchShape === "square") {
                            form.setValue("height", values[0]);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height: {field.value}px</FormLabel>
                    <FormControl>
                      <Slider
                        min={50}
                        max={300}
                        step={10}
                        value={[field.value]}
                        onValueChange={(values) => {
                          field.onChange(values[0]);
                          // For round and square tables, keep width and height equal
                          if (watchShape === "round" || watchShape === "square") {
                            form.setValue("width", values[0]);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Table</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTableDialog;
