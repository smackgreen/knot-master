
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Users, CheckSquare, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-16 bg-wedding-ivory text-center">
        <div className="w-full px-2">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
            <span className="text-primary">Knot To It</span> Wedding Planner CRM
          </h1>
          <p className="text-lg md:text-xl mb-8">
            Streamline your wedding planning business with our comprehensive client management system designed exclusively for wedding planners.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/app/dashboard')}>
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/intake-form')}>
              Client Intake Form
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow py-16 bg-background">
        <div className="w-full px-2">
          <h2 className="text-3xl font-serif font-bold text-center mb-12">Everything You Need to Manage Your Wedding Business</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <FeatureCard
              icon={<Users className="h-12 w-12 text-primary" />}
              title="Client Management"
              description="Keep all your client details organized in one place, from contact info to wedding preferences."
              onClick={() => navigate('/app/clients')}
            />
            <FeatureCard
              icon={<Calendar className="h-12 w-12 text-primary" />}
              title="Wedding Timelines"
              description="Track upcoming weddings, important deadlines, and vendor coordination all in one calendar."
              onClick={() => navigate('/app/dashboard')}
            />
            <FeatureCard
              icon={<CheckSquare className="h-12 w-12 text-primary" />}
              title="Task Tracking"
              description="Never miss a deadline with our comprehensive task management system for each wedding."
              onClick={() => navigate('/app/tasks')}
            />
          </div>

          <div className="text-center">
            <Button size="lg" onClick={() => navigate('/app/dashboard')}>
              Start Managing Your Weddings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>

      <footer className="bg-muted py-8">
        <div className="w-full px-2 text-center">
          <p className="text-muted-foreground">© {new Date().getFullYear()} Knot To It Wedding Planner CRM</p>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const FeatureCard = ({ icon, title, description, onClick }: FeatureCardProps) => (
  <div
    className="flex flex-col items-center text-center p-6 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
    onClick={onClick}
  >
    <div className="mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-serif font-bold mb-3">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Index;
