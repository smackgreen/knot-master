
import { useFormContext } from "react-hook-form";
import { TaskFormValues } from "./types";
import { useApp } from "@/context/AppContext";
import {
  TitleField,
  DescriptionField,
  DueDateField,
  PriorityField,
  StatusField,
  CategoryField,
  ClientField,
} from "./fields";

export const FormFields = () => {
  const form = useFormContext<TaskFormValues>();
  const { clients } = useApp();

  return (
    <div className="space-y-4">
      <TitleField form={form} />
      <DescriptionField form={form} />
      <ClientField form={form} clients={clients} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DueDateField form={form} />
        <PriorityField form={form} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatusField form={form} />
        <CategoryField form={form} />
      </div>
    </div>
  );
};
