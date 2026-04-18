import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Table, TableShape } from "@/types";
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

interface EditTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table;
  onTableUpdated: () => void;
}

const tableFormSchema = z.object({
  name: z.string().min(1, "Table name is required"),
  shape: z.enum(["round", "rectangular", "square", "custom"] as const),
  capacity: z.number().min(1, "Capacity must be at least 1").max(20, "Capacity cannot exceed 20"),
  width: z.number().min(50, "Width must be at least 50").max(300, "Width cannot exceed 300"),
  height: z.number().min(50, "Height must be at least 50").max(300, "Height cannot exceed 300"),
  positionX: z.number().min(0),
  positionY: z.number().min(0),
  rotation: z.number(),
});

type TableFormValues = z.infer<typeof tableFormSchema>;

const EditTableDialog = ({ open, onOpenChange, table, onTableUpdated }: EditTableDialogProps) => {
  const { updateTable } = useApp();

  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: {
      name: table.name,
      shape: table.shape,
      capacity: table.capacity,
      width: table.width,
      height: table.height,
      positionX: table.positionX,
      positionY: table.positionY,
      rotation: table.rotation,
    },
  });

  // Update form when table changes
  useEffect(() => {
    form.reset({
      name: table.name,
      shape: table.shape,
      capacity: table.capacity,
      width: table.width,
      height: table.height,
      positionX: table.positionX,
      positionY: table.positionY,
      rotation: table.rotation,
    });
  }, [table, form]);

  const watchShape = form.watch("shape");

  // Update width/height when shape changes
  const onShapeChange = (shape: TableShape) => {
    if (shape === "round" || shape === "square") {
      // For round and square tables, ensure width and height are equal
      const size = Math.max(form.getValues("width"), form.getValues("height"));
      form.setValue("width", size);
      form.setValue("height", size);
    }
  };

  const onSubmit = async (values: TableFormValues) => {
    try {
      await updateTable(table.id, values);
      onTableUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating table:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Table</DialogTitle>
          <DialogDescription>
            Update the table properties.
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
                    <Input {...field} />
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
                        <div className={`border rounded-md p-4 cursor-pointer hover:bg-muted/50 transition-colors ${field.value === 'round' ? 'bg-muted border-primary' : ''}`}>
                          <Circle className="h-8 w-8 text-emerald-500" />
                        </div>
                        <RadioGroupItem value="round" id="edit-round" className="sr-only" />
                        <label htmlFor="edit-round" className="text-xs">Round</label>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <div className={`border rounded-md p-4 cursor-pointer hover:bg-muted/50 transition-colors ${field.value === 'square' ? 'bg-muted border-primary' : ''}`}>
                          <Square className="h-8 w-8 text-blue-500" />
                        </div>
                        <RadioGroupItem value="square" id="edit-square" className="sr-only" />
                        <label htmlFor="edit-square" className="text-xs">Square</label>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <div className={`border rounded-md p-4 cursor-pointer hover:bg-muted/50 transition-colors ${field.value === 'rectangular' ? 'bg-muted border-primary' : ''}`}>
                          <RectangleHorizontal className="h-8 w-8 text-red-500" />
                        </div>
                        <RadioGroupItem value="rectangular" id="edit-rectangular" className="sr-only" />
                        <label htmlFor="edit-rectangular" className="text-xs">Rectangular</label>
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

            <FormField
              control={form.control}
              name="rotation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rotation: {field.value}°</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={359}
                      step={15}
                      value={[field.value]}
                      onValueChange={(values) => field.onChange(values[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTableDialog;
