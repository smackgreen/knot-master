import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import AdminSubscriptions from "./AdminSubscriptions";
import AdminCoupons from "./AdminCoupons";

const AdminDashboard = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-7 w-7 text-wedding-blush" />
        <div>
          <h1 className="text-3xl font-serif font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage users, subscriptions and promotional coupons
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="sr-only">Admin tools</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="subscriptions">
            <TabsList>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="coupons">Coupons</TabsTrigger>
            </TabsList>
            <TabsContent value="subscriptions" className="mt-6">
              <AdminSubscriptions />
            </TabsContent>
            <TabsContent value="coupons" className="mt-6">
              <AdminCoupons />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;

